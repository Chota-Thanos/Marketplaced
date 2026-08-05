<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WishlistController extends Controller
{
    private const ITEM_RELATIONS = ['items.product.variants', 'items.product.category', 'items.variant'];

    public function index(Request $request)
    {
        $user = $request->user();
        $user->defaultWishlist(); // ensure at least one exists

        $wishlists = $user->wishlists()->with(self::ITEM_RELATIONS)->orderByDesc('is_default')->get();

        return response()->json(['status' => 'success', 'data' => $wishlists]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:120']);

        $wishlist = $request->user()->wishlists()->create([
            'name' => $validated['name'],
            'is_default' => false,
        ]);

        return response()->json(['status' => 'success', 'data' => $wishlist->load(self::ITEM_RELATIONS)], 201);
    }

    public function update(Request $request, $id)
    {
        $wishlist = $request->user()->wishlists()->find($id);

        if (! $wishlist) {
            return response()->json(['status' => 'error', 'message' => 'Wishlist not found'], 404);
        }

        $validated = $request->validate(['name' => 'required|string|max:120']);
        $wishlist->update($validated);

        return response()->json(['status' => 'success', 'data' => $wishlist]);
    }

    public function destroy(Request $request, $id)
    {
        $wishlist = $request->user()->wishlists()->find($id);

        if (! $wishlist) {
            return response()->json(['status' => 'error', 'message' => 'Wishlist not found'], 404);
        }

        if ($wishlist->is_default) {
            return response()->json(['status' => 'error', 'message' => 'Cannot delete your default wishlist.'], 422);
        }

        $wishlist->delete();

        return response()->json(['status' => 'success', 'message' => 'Wishlist deleted']);
    }

    /** Add an item. Defaults to the user's default wishlist when none given. */
    public function addItem(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'variant_id' => 'nullable|uuid|exists:product_variants,id',
            'wishlist_id' => 'nullable|uuid',
        ]);

        $user = $request->user();

        $wishlist = ! empty($validated['wishlist_id'])
            ? $user->wishlists()->find($validated['wishlist_id'])
            : $user->defaultWishlist();

        if (! $wishlist) {
            return response()->json(['status' => 'error', 'message' => 'Wishlist not found'], 404);
        }

        $product = Product::find($validated['product_id']);

        $item = $wishlist->items()->firstOrCreate(
            [
                'product_id' => $validated['product_id'],
                'variant_id' => $validated['variant_id'] ?? null,
            ],
            ['price_at_add' => $product->price],
        );

        return response()->json([
            'status' => 'success',
            'data' => $item->load('product.variants', 'product.category', 'variant'),
        ], 201);
    }

    public function removeItem(Request $request, $itemId)
    {
        $item = \App\Models\WishlistItem::whereHas(
            'wishlist',
            fn ($q) => $q->where('user_id', $request->user()->id)
        )->find($itemId);

        if (! $item) {
            return response()->json(['status' => 'error', 'message' => 'Item not found'], 404);
        }

        $item->delete();

        return response()->json(['status' => 'success', 'message' => 'Removed from wishlist']);
    }

    /** Generate (or reuse) a public share token for gifting use-cases. */
    public function share(Request $request, $id)
    {
        $wishlist = $request->user()->wishlists()->find($id);

        if (! $wishlist) {
            return response()->json(['status' => 'error', 'message' => 'Wishlist not found'], 404);
        }

        if (! $wishlist->share_token) {
            $wishlist->update(['share_token' => Str::random(32)]);
        }

        return response()->json([
            'status' => 'success',
            'data' => ['share_token' => $wishlist->fresh()->share_token],
        ]);
    }

    /** Public: view a shared wishlist by token. No auth required. */
    public function viewShared($token)
    {
        $wishlist = Wishlist::with(self::ITEM_RELATIONS)
            ->with('user:id,name')
            ->where('share_token', $token)
            ->first();

        if (! $wishlist) {
            return response()->json(['status' => 'error', 'message' => 'Shared wishlist not found'], 404);
        }

        return response()->json(['status' => 'success', 'data' => $wishlist]);
    }
}
