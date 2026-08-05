<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductView;
use App\Models\SearchQuery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    private const VARIANT_RULES = [
        'variants' => 'nullable|array',
        'variants.*.color' => 'nullable|string',
        'variants.*.size' => 'nullable|string',
        'variants.*.sku' => 'nullable|string',
        'variants.*.stock' => 'nullable|integer|min:0',
        'variants.*.price' => 'nullable|numeric|min:0',
        'variants.*.mrp' => 'nullable|numeric|min:0',
        'variants.*.cost_price' => 'nullable|numeric|min:0',
    ];

    private const PRESENTATION_RULES = [
        'rollover_image' => 'nullable|string',
        'authenticity_grade' => 'nullable|string',
        'local_store_available' => 'nullable|boolean',
        'local_store_name' => 'nullable|string',
        'express_pincodes' => 'nullable|array',
        'hotspots' => 'nullable|array',
        'spin_images' => 'nullable|array',
        'cod_available' => 'nullable|boolean',
        // Shoppertainment is opt-in per product. Nullable with no other rule
        // implying a requirement — a product is complete and sellable with
        // neither of these ever set.
        'reel_video_url' => 'nullable|string|max:1000',
        'reel_caption' => 'nullable|string|max:160',
    ];

    public function index(Request $request)
    {
        $query = Product::with(['category', 'variants']);

        if ($request->filled('category') && $request->category !== 'all') {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->category));
        }

        // Full-text (tsvector) with a trigram-similarity fallback so typos like
        // "anarkli" still match. Falls back to ILIKE only if the index is absent.
        if ($request->filled('search')) {
            $term = trim($request->search);
            $query->where(function ($q) use ($term) {
                // word_similarity compares the term against the best-matching
                // word in the title, so "anarkli" still hits "Anarkali" in a
                // long title where whole-string similarity() would score ~0.05.
                $q->whereRaw("search_vector @@ plainto_tsquery('english', ?)", [$term])
                    ->orWhereRaw('word_similarity(?, title) > 0.5', [$term])
                    ->orWhere('title', 'ILIKE', '%'.$term.'%')
                    ->orWhere('brand', 'ILIKE', '%'.$term.'%');
            });
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->max_price);
        }
        if ($request->filled('brand')) {
            $query->where('brand', $request->brand);
        }
        if ($request->boolean('is_new')) {
            $query->where('is_new', true);
        }
        if ($request->boolean('in_stock')) {
            $query->whereHas('variants', fn ($q) => $q->where('stock', '>', 0));
        }

        // Price/date sorts run in SQL. Rating and popularity are derived from
        // related tables, so they're sorted after hydration below.
        $sort = $request->get('sort', 'newest');

        // With a search term and no explicit sort, rank by text relevance.
        if ($request->filled('search') && $request->get('sort') === null) {
            $query->orderByRaw(
                "ts_rank(search_vector, plainto_tsquery('english', ?)) DESC, word_similarity(?, title) DESC",
                [trim($request->search), trim($request->search)]
            );
        } else {
            match ($sort) {
                'price_asc' => $query->orderBy('price'),
                'price_desc' => $query->orderByDesc('price'),
                'oldest' => $query->orderBy('created_at'),
                default => $query->orderByDesc('created_at'),
            };
        }

        $products = $query->get();

        if ($sort === 'rating') {
            $products = $products->sortByDesc(fn ($p) => $p->rating)->values();
        } elseif ($sort === 'popularity') {
            $products = $products->sortByDesc(fn ($p) => $p->reviews_count)->values();
        }

        if ($request->filled('min_rating')) {
            $minRating = (float) $request->min_rating;
            $products = $products->filter(fn ($p) => $p->rating >= $minRating)->values();
        }

        // Log the query so the admin search report (top queries / zero-result
        // inventory gaps) has real data to aggregate.
        if ($request->filled('search')) {
            $this->logSearch($request, $products->count());
        }

        return response()->json([
            'status' => 'success',
            'count' => $products->count(),
            'facets' => $this->facets(),
            'data' => $products->values(),
        ]);
    }

    private function logSearch(Request $request, int $resultCount): void
    {
        try {
            $raw = trim($request->search);
            SearchQuery::create([
                'query' => $raw,
                'normalised_query' => mb_strtolower(preg_replace('/\s+/', ' ', $raw)),
                'result_count' => $resultCount,
                'user_id' => optional($request->user())->id,
            ]);
        } catch (\Throwable $e) {
            // Analytics must never break the search response.
            Log::warning('Search logging failed: '.$e->getMessage());
        }
    }

    /** Filter bounds for the storefront's filter panel. */
    private function facets(): array
    {
        return [
            'price_min' => (float) (Product::min('price') ?? 0),
            'price_max' => (float) (Product::max('price') ?? 0),
            'brands' => Product::whereNotNull('brand')->distinct()->orderBy('brand')->pluck('brand'),
        ];
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:products,slug',
            'description' => 'nullable|string',
            'category_id' => 'required|uuid|exists:categories,id',
            'brand' => 'nullable|string',
            'mrp' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'images' => 'nullable|array',
            'status' => 'nullable|in:DRAFT,ACTIVE,OUT_OF_STOCK,DISCONTINUED',
            'is_new' => 'nullable|boolean',
            'tags' => 'nullable|array',
            'features' => 'nullable|array',
            'features.*' => 'string|max:500',
            ...self::VARIANT_RULES,
            ...self::PRESENTATION_RULES,
        ]);

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['title']);
        $variants = $validated['variants'] ?? [['color' => 'Standard', 'size' => 'Free Size', 'stock' => 10]];
        unset($validated['variants']);

        $product = Product::create($validated);
        $product->variants()->createMany($variants);

        return response()->json(['status' => 'success', 'data' => $product->load(['category', 'variants'])], 201);
    }

    public function show(Request $request, $id)
    {
        $product = Product::with(['category', 'variants', 'approvedReviews'])->find($id);

        if (! $product) {
            return response()->json(['status' => 'error', 'message' => 'Product not found'], 404);
        }

        // Feeds the Trending engine and personalised recommendations.
        try {
            ProductView::create([
                'product_id' => $product->id,
                'user_id' => optional($request->user())->id,
            ]);
        } catch (\Throwable $e) {
            Log::warning('View tracking failed: '.$e->getMessage());
        }

        return response()->json(['status' => 'success', 'data' => $product]);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (! $product) {
            return response()->json(['status' => 'error', 'message' => 'Product not found'], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'slug' => ['sometimes', 'string', Rule::unique('products', 'slug')->ignore($product->id)],
            'description' => 'nullable|string',
            'category_id' => 'sometimes|uuid|exists:categories,id',
            'brand' => 'nullable|string',
            'mrp' => 'sometimes|numeric|min:0',
            'price' => 'sometimes|numeric|min:0',
            'images' => 'nullable|array',
            'status' => 'nullable|in:DRAFT,ACTIVE,OUT_OF_STOCK,DISCONTINUED',
            'is_new' => 'nullable|boolean',
            'tags' => 'nullable|array',
            'features' => 'nullable|array',
            'features.*' => 'string|max:500',
            ...self::VARIANT_RULES,
            ...self::PRESENTATION_RULES,
        ]);

        $variants = $validated['variants'] ?? null;
        unset($validated['variants']);

        $product->update($validated);

        // The admin form always submits the full current variant list, so
        // replacing them wholesale keeps stock/price edits and add/remove in sync.
        if ($variants !== null) {
            $product->variants()->delete();
            $product->variants()->createMany($variants);
        }

        return response()->json(['status' => 'success', 'data' => $product->load(['category', 'variants'])]);
    }

    public function destroy($id)
    {
        $product = Product::find($id);

        if (! $product) {
            return response()->json(['status' => 'error', 'message' => 'Product not found'], 404);
        }

        $product->delete();

        return response()->json(['status' => 'success', 'message' => 'Product deleted successfully']);
    }
}
