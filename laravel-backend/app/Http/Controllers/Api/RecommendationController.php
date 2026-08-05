<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductView;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecommendationController extends Controller
{
    private const WITH = ['category', 'variants'];

    /**
     * Trending = weighted blend of recent purchases and recent views inside a
     * rolling window, so it reflects what's hot now rather than all-time totals.
     */
    public function trending(Request $request)
    {
        $days = (int) $request->get('days', 7);
        $since = now()->subDays(max(1, min($days, 90)));

        $orderScores = OrderItem::whereHas('order', fn ($q) => $q
                ->where('created_at', '>=', $since)
                ->where('status', '!=', 'CANCELLED'))
            ->select('product_id')
            ->selectRaw('SUM(quantity) as units')
            ->groupBy('product_id')
            ->pluck('units', 'product_id');

        $viewScores = ProductView::where('created_at', '>=', $since)
            ->select('product_id')
            ->selectRaw('COUNT(*) as views')
            ->groupBy('product_id')
            ->pluck('views', 'product_id');

        // A purchase is a far stronger signal than a view.
        $scores = [];
        foreach ($orderScores as $id => $units) {
            $scores[$id] = ($scores[$id] ?? 0) + ((int) $units * 10);
        }
        foreach ($viewScores as $id => $views) {
            $scores[$id] = ($scores[$id] ?? 0) + (int) $views;
        }
        arsort($scores);

        $ids = array_slice(array_keys($scores), 0, 8);

        // Cold start (no activity yet): fall back to newest active products
        // rather than returning an empty row on the homepage.
        if (empty($ids)) {
            $products = Product::with(self::WITH)->where('status', 'ACTIVE')
                ->orderByDesc('created_at')->limit(8)->get();
        } else {
            $products = Product::with(self::WITH)->where('status', 'ACTIVE')
                ->whereIn('id', $ids)->get()
                ->sortBy(fn ($p) => array_search($p->id, $ids))
                ->values();
        }

        return response()->json(['status' => 'success', 'count' => $products->count(), 'data' => $products]);
    }

    /**
     * Personalised picks via item-to-item collaborative filtering: find what
     * other customers also bought in the same orders as this user's items,
     * then top up with category affinity from their browsing history.
     */
    public function personalized(Request $request)
    {
        $user = $request->user();

        $ownedProductIds = OrderItem::whereHas('order', fn ($q) => $q->where('user_id', $user->id))
            ->pluck('product_id')->unique()->all();

        $viewedProductIds = ProductView::where('user_id', $user->id)
            ->orderByDesc('created_at')->limit(50)
            ->pluck('product_id')->unique()->all();

        $seedIds = array_values(array_unique(array_merge($ownedProductIds, $viewedProductIds)));

        // No history at all — hand back trending instead of random noise.
        if (empty($seedIds)) {
            return $this->trending($request);
        }

        // Orders (by anyone) that contained one of the seed products...
        $coOrderIds = OrderItem::whereIn('product_id', $seedIds)->pluck('order_id')->unique();

        // ...and what else those orders contained.
        $coPurchased = OrderItem::whereIn('order_id', $coOrderIds)
            ->whereNotIn('product_id', $ownedProductIds)
            ->select('product_id')
            ->selectRaw('COUNT(*) as freq')
            ->groupBy('product_id')
            ->orderByDesc('freq')
            ->limit(8)
            ->pluck('freq', 'product_id')
            ->all();

        $ids = array_keys($coPurchased);

        // Top up from categories the user has shown interest in.
        if (count($ids) < 8) {
            $categoryIds = Product::whereIn('id', $seedIds)->pluck('category_id')->unique();
            $filler = Product::where('status', 'ACTIVE')
                ->whereIn('category_id', $categoryIds)
                ->whereNotIn('id', array_merge($ids, $ownedProductIds))
                ->orderByDesc('created_at')
                ->limit(8 - count($ids))
                ->pluck('id')
                ->all();
            $ids = array_merge($ids, $filler);
        }

        $products = Product::with(self::WITH)->where('status', 'ACTIVE')
            ->whereIn('id', $ids)->get()
            ->sortBy(fn ($p) => array_search($p->id, $ids))
            ->values();

        return response()->json(['status' => 'success', 'count' => $products->count(), 'data' => $products]);
    }

    /** "Customers who bought this also bought" for a single product's PDP. */
    public function relatedTo(Request $request, $productId)
    {
        $product = Product::find($productId);
        if (! $product) {
            return response()->json(['status' => 'error', 'message' => 'Product not found'], 404);
        }

        $coOrderIds = OrderItem::where('product_id', $productId)->pluck('order_id');

        $ids = OrderItem::whereIn('order_id', $coOrderIds)
            ->where('product_id', '!=', $productId)
            ->select('product_id')
            ->selectRaw('COUNT(*) as freq')
            ->groupBy('product_id')
            ->orderByDesc('freq')
            ->limit(6)
            ->pluck('product_id')
            ->all();

        // Fall back to same-category siblings when nothing has co-sold yet.
        if (count($ids) < 4) {
            $filler = Product::where('status', 'ACTIVE')
                ->where('category_id', $product->category_id)
                ->where('id', '!=', $productId)
                ->whereNotIn('id', $ids)
                ->limit(6 - count($ids))
                ->pluck('id')
                ->all();
            $ids = array_merge($ids, $filler);
        }

        $products = Product::with(self::WITH)->whereIn('id', $ids)->get();

        return response()->json(['status' => 'success', 'count' => $products->count(), 'data' => $products]);
    }
}
