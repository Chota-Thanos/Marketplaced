<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use App\Models\ReviewVote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    private const ATTRIBUTES = ['quality', 'value', 'packaging', 'delivery'];

    /**
     * Public: approved reviews for a product, plus the rating histogram and
     * attribute averages the PDP needs. Sort options mirror the UI controls.
     */
    public function index(Request $request, $productId)
    {
        $query = Review::with('user:id,name,created_at')
            ->where('product_id', $productId)
            ->where('status', 'APPROVED');

        if ($request->filled('rating')) {
            $query->where('rating', (int) $request->rating);
        }

        match ($request->get('sort')) {
            'recent' => $query->orderByDesc('created_at'),
            'critical' => $query->orderBy('rating')->orderByDesc('helpful_count'),
            'highest' => $query->orderByDesc('rating')->orderByDesc('helpful_count'),
            default => $query->orderByDesc('helpful_count')->orderByDesc('created_at'),
        };

        $reviews = $query->get();

        $all = Review::where('product_id', $productId)->where('status', 'APPROVED')->get();

        $histogram = [];
        foreach (range(5, 1) as $star) {
            $histogram[$star] = $all->where('rating', $star)->count();
        }

        $attributeAverages = [];
        foreach (self::ATTRIBUTES as $attribute) {
            $values = $all->pluck("attribute_ratings.$attribute")->filter(fn ($v) => $v !== null);
            $attributeAverages[$attribute] = $values->isEmpty() ? null : round($values->avg(), 1);
        }

        // Which of these the current user has already voted on, so the UI can
        // render their existing vote instead of letting them double-count.
        $myVotes = [];
        if ($request->user()) {
            $myVotes = ReviewVote::where('user_id', $request->user()->id)
                ->whereIn('review_id', $reviews->pluck('id'))
                ->pluck('is_helpful', 'review_id')
                ->all();
        }

        return response()->json([
            'status' => 'success',
            'count' => $reviews->count(),
            'summary' => [
                'average' => $all->isEmpty() ? 0 : round($all->avg('rating'), 1),
                'total' => $all->count(),
                'histogram' => $histogram,
                'attribute_averages' => $attributeAverages,
                // Computed from these exact reviews — see AIService.
                'narrative' => app(\App\Services\AIService::class)->summarizeReviews(
                    optional($all->first()?->product)->title ?? 'this product',
                    $all->map(fn ($r) => ['rating' => $r->rating, 'body' => (string) $r->body])->all(),
                ),
                'is_ai_generated' => filled(config('services.gemini.key')),
            ],
            'my_votes' => $myVotes,
            'data' => $reviews,
        ]);
    }

    /** Which of the user's delivered items are still awaiting a review. */
    public function reviewable(Request $request)
    {
        $user = $request->user();

        $orders = Order::with('items.product')
            ->where('user_id', $user->id)
            ->where('status', 'DELIVERED')
            ->get();

        $reviewed = Review::where('user_id', $user->id)
            ->get()
            ->map(fn ($r) => $r->product_id.':'.$r->order_id)
            ->all();

        $pending = [];
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                if (in_array($item->product_id.':'.$order->id, $reviewed, true)) {
                    continue;
                }
                $pending[] = [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'product_id' => $item->product_id,
                    'product' => $item->product,
                    'delivered_at' => $order->delivered_at ?? $order->updated_at,
                ];
            }
        }

        return response()->json(['status' => 'success', 'data' => $pending]);
    }

    /** The signed-in customer's own review history. */
    public function mine(Request $request)
    {
        $reviews = Review::with('product')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['status' => 'success', 'data' => $reviews]);
    }

    /** Purchase-gated: the user must have a DELIVERED order containing this product. */
    public function store(Request $request, $productId)
    {
        $validated = $request->validate([
            'order_id' => 'required|uuid|exists:orders,id',
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'body' => 'nullable|string',
            'media' => 'nullable|array',
            'attribute_ratings' => 'nullable|array',
        ]);

        $user = $request->user();

        $order = Order::where('id', $validated['order_id'])
            ->where('user_id', $user->id)
            ->where('status', 'DELIVERED')
            ->whereHas('items', fn ($q) => $q->where('product_id', $productId))
            ->first();

        if (! $order) {
            return response()->json([
                'status' => 'error',
                'message' => 'You can only review products from your own delivered orders.',
            ], 403);
        }

        $existing = Review::where('product_id', $productId)
            ->where('user_id', $user->id)
            ->where('order_id', $order->id)
            ->first();

        if ($existing) {
            return response()->json(['status' => 'error', 'message' => 'You already reviewed this order.'], 409);
        }

        // Fraud pre-screen — the score surfaces in the admin moderation queue
        // so obvious spam can be triaged first. It never auto-rejects.
        $fraudScore = app(\App\Services\AIService::class)->detectReviewFraud((string) ($validated['body'] ?? ''));

        $review = Review::create([
            ...$validated,
            'product_id' => $productId,
            'user_id' => $user->id,
            'verified_purchase' => true,
            'ai_fraud_score' => $fraudScore,
            'status' => 'PENDING', // admin moderation queue
        ]);

        return response()->json(['status' => 'success', 'data' => $review], 201);
    }

    /** Admin moderation queue. */
    public function pending()
    {
        $reviews = Review::with(['product', 'user'])->where('status', 'PENDING')->orderBy('created_at')->get();

        return response()->json(['status' => 'success', 'count' => $reviews->count(), 'data' => $reviews]);
    }

    public function moderate(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:APPROVED,REJECTED',
        ]);

        $review = Review::find($id);

        if (! $review) {
            return response()->json(['status' => 'error', 'message' => 'Review not found'], 404);
        }

        $review->update(['status' => $validated['status']]);

        return response()->json(['status' => 'success', 'data' => $review]);
    }

    /** Admin: post a public "Brand Response" under a review. */
    public function reply(Request $request, $id)
    {
        $validated = $request->validate(['admin_reply' => 'required|string|max:2000']);

        $review = Review::find($id);

        if (! $review) {
            return response()->json(['status' => 'error', 'message' => 'Review not found'], 404);
        }

        $review->update([
            'admin_reply' => $validated['admin_reply'],
            'admin_replied_at' => now(),
        ]);

        return response()->json(['status' => 'success', 'data' => $review->fresh()]);
    }

    /**
     * Helpful / not-helpful vote. Upserts the user's vote and recomputes the
     * counters from the votes table, so re-voting or flipping a vote can never
     * drift the totals out of sync with reality.
     */
    public function vote(Request $request, $id)
    {
        $validated = $request->validate(['is_helpful' => 'required|boolean']);

        $review = Review::find($id);

        if (! $review) {
            return response()->json(['status' => 'error', 'message' => 'Review not found'], 404);
        }

        $user = $request->user();

        if ($review->user_id === $user->id) {
            return response()->json(['status' => 'error', 'message' => 'You cannot vote on your own review.'], 422);
        }

        DB::transaction(function () use ($review, $user, $validated) {
            ReviewVote::updateOrCreate(
                ['review_id' => $review->id, 'user_id' => $user->id],
                ['is_helpful' => $validated['is_helpful']],
            );

            // Direct assignment — the vote counters are derived values and are
            // intentionally not mass-assignable.
            $review->helpful_count = $review->votes()->where('is_helpful', true)->count();
            $review->not_helpful_count = $review->votes()->where('is_helpful', false)->count();
            $review->save();
        });

        return response()->json(['status' => 'success', 'data' => $review->fresh()]);
    }
}
