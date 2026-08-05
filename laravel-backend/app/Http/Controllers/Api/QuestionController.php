<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\ProductAnswer;
use App\Models\ProductQuestion;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    /** Public: approved Q&A for a product's PDP. */
    public function index(string $productId)
    {
        $questions = ProductQuestion::where('product_id', $productId)
            ->where('status', 'APPROVED')
            ->with([
                'user:id,name',
                'answers' => fn ($q) => $q->with('user:id,name')
                    ->orderByDesc('is_official')
                    ->orderByDesc('helpful_count'),
            ])
            ->orderByDesc('helpful_count')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'count' => $questions->count(),
            'data' => $questions,
        ]);
    }

    public function store(Request $request, string $productId)
    {
        $validated = $request->validate(['body' => 'required|string|max:1000']);

        $question = ProductQuestion::create([
            'product_id' => $productId,
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
            'status' => 'PENDING',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Question submitted and pending moderation.',
            'data' => $question,
        ], 201);
    }

    public function answer(Request $request, string $id)
    {
        $validated = $request->validate(['body' => 'required|string|max:2000']);

        $question = ProductQuestion::find($id);
        if (! $question) {
            return response()->json(['status' => 'error', 'message' => 'Question not found'], 404);
        }

        $user = $request->user();

        // "Verified buyer" is proven against a delivered order, same gate the
        // review system uses — not self-asserted.
        $isVerifiedBuyer = OrderItem::where('product_id', $question->product_id)
            ->whereHas('order', fn ($q) => $q->where('user_id', $user->id)->where('status', 'DELIVERED'))
            ->exists();

        $answer = ProductAnswer::create([
            'question_id' => $question->id,
            'user_id' => $user->id,
            'body' => $validated['body'],
            'is_official' => $user->isAdmin(),
            'is_verified_buyer' => $isVerifiedBuyer,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Answer submitted.',
            'data' => $answer->load('user:id,name'),
        ], 201);
    }

    public function voteHelpful(Request $request, string $id)
    {
        $answer = ProductAnswer::find($id);
        if (! $answer) {
            return response()->json(['status' => 'error', 'message' => 'Answer not found'], 404);
        }

        $answer->increment('helpful_count');

        return response()->json(['status' => 'success', 'data' => $answer->fresh()]);
    }

    // ── Admin ────────────────────────────────────────────────────────────

    /** Moderation queue. Defaults to PENDING, the only actionable state. */
    public function pending(Request $request)
    {
        $status = $request->get('status', 'PENDING');

        $questions = ProductQuestion::where('status', $status)
            ->with(['user:id,name,email', 'product:id,title', 'answers.user:id,name'])
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'count' => $questions->count(),
            'data' => $questions,
        ]);
    }

    public function moderate(Request $request, string $id)
    {
        $validated = $request->validate(['status' => 'required|in:APPROVED,REJECTED']);

        $question = ProductQuestion::find($id);
        if (! $question) {
            return response()->json(['status' => 'error', 'message' => 'Question not found'], 404);
        }

        $question->update(['status' => $validated['status']]);

        return response()->json(['status' => 'success', 'data' => $question]);
    }
}
