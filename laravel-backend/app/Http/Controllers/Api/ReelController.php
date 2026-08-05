<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

/**
 * Shoppertainment feed. Public, read-only.
 *
 * Deliberately its own thin controller rather than a filter on
 * ProductController@index: the two have different failure modes. An empty
 * catalogue is broken; an empty Reels feed is the normal state for a store
 * that has never recorded a clip, and the response here reflects that instead
 * of looking like an error.
 */
class ReelController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $products = Product::query()
            ->with('category')
            ->where('status', 'ACTIVE')
            ->whereNotNull('reel_video_url')
            ->where('reel_video_url', '!=', '')
            ->latest('updated_at')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'status' => 'success',
            'data' => $products->items(),
            'meta' => [
                'total' => $products->total(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
            ],
        ]);
    }
}
