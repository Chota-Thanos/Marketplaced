<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\ReturnRequest;
use App\Services\Contracts\LogisticsProvider;
use App\Services\Contracts\PaymentGateway;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReturnController extends Controller
{
    public const RETURN_WINDOW_DAYS = 7;

    /** Customer: their own return/exchange requests. */
    public function mine(Request $request)
    {
        $returns = ReturnRequest::with(['orderItem.product', 'order'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['status' => 'success', 'data' => $returns]);
    }

    /** Customer: raise a return or exchange against a delivered order item. */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_item_id' => 'required|uuid|exists:order_items,id',
            'kind' => 'required|in:RETURN,EXCHANGE',
            'reason' => 'required|string|max:255',
            'comments' => 'nullable|string',
            'media' => 'nullable|array',
            'quantity' => 'nullable|integer|min:1',
            'refund_mode' => 'nullable|in:SOURCE,WALLET',
            'exchange_variant_id' => 'nullable|uuid|exists:product_variants,id',
        ]);

        $user = $request->user();
        $item = OrderItem::with('order')->find($validated['order_item_id']);

        if ($item->order->user_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
        }

        if (! $item->order->isReturnable(self::RETURN_WINDOW_DAYS)) {
            return response()->json([
                'status' => 'error',
                'message' => 'This order is outside the '.self::RETURN_WINDOW_DAYS.'-day return window or has not been delivered.',
            ], 422);
        }

        if ($item->returnRequests()->whereNotIn('status', ['REJECTED'])->exists()) {
            return response()->json(['status' => 'error', 'message' => 'A return is already open for this item.'], 409);
        }

        $quantity = $validated['quantity'] ?? $item->quantity;
        if ($quantity > $item->quantity) {
            return response()->json(['status' => 'error', 'message' => 'Quantity exceeds what was ordered.'], 422);
        }

        if ($validated['kind'] === 'EXCHANGE' && empty($validated['exchange_variant_id'])) {
            return response()->json(['status' => 'error', 'message' => 'Choose a variant to exchange for.'], 422);
        }

        $return = ReturnRequest::create([
            'rma_number' => 'RMA-'.strtoupper(Str::random(8)),
            'order_id' => $item->order_id,
            'order_item_id' => $item->id,
            'user_id' => $user->id,
            'kind' => $validated['kind'],
            'reason' => $validated['reason'],
            'comments' => $validated['comments'] ?? null,
            'media' => $validated['media'] ?? null,
            'quantity' => $quantity,
            'refund_mode' => $validated['refund_mode'] ?? 'SOURCE',
            'refund_amount' => round((float) $item->price * $quantity, 2),
            'exchange_variant_id' => $validated['exchange_variant_id'] ?? null,
            'status' => 'REQUESTED',
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $return->load('orderItem.product'),
        ], 201);
    }

    // ── Admin ────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = ReturnRequest::with(['orderItem.product', 'order', 'user'])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $returns = $query->get();

        return response()->json(['status' => 'success', 'count' => $returns->count(), 'data' => $returns]);
    }

    /** Admin: approve — schedules a reverse pickup via the logistics provider. */
    public function approve(Request $request, $id, LogisticsProvider $logistics, NotificationService $notifications)
    {
        $return = ReturnRequest::with('user')->find($id);

        if (! $return) {
            return response()->json(['status' => 'error', 'message' => 'Return not found'], 404);
        }

        if ($return->status !== 'REQUESTED') {
            return response()->json(['status' => 'error', 'message' => 'This return has already been actioned.'], 422);
        }

        $pickup = $logistics->schedulePickup($return);

        $return->update([
            'status' => 'PICKUP_SCHEDULED',
            'pickup_tracking_no' => $pickup['pickup_tracking_no'],
            'admin_note' => $request->input('admin_note'),
        ]);

        $notifications->refundUpdate($return, 'approved — pickup scheduled for '.$pickup['scheduled_for']);

        return response()->json(['status' => 'success', 'data' => $return->fresh(), 'pickup' => $pickup]);
    }

    public function reject(Request $request, $id, NotificationService $notifications)
    {
        $return = ReturnRequest::with('user')->find($id);

        if (! $return) {
            return response()->json(['status' => 'error', 'message' => 'Return not found'], 404);
        }

        $validated = $request->validate(['admin_note' => 'required|string|max:500']);

        $return->update([
            'status' => 'REJECTED',
            'refund_status' => 'PENDING',
            'admin_note' => $validated['admin_note'],
            'resolved_at' => now(),
        ]);

        $notifications->refundUpdate($return, 'rejected');

        return response()->json(['status' => 'success', 'data' => $return->fresh()]);
    }

    /** Admin: mark the parcel as collected by the courier. */
    public function markPickedUp($id, NotificationService $notifications)
    {
        $return = ReturnRequest::with('user')->find($id);

        if (! $return) {
            return response()->json(['status' => 'error', 'message' => 'Return not found'], 404);
        }

        $return->update(['status' => 'PICKED_UP']);
        $notifications->refundUpdate($return, 'item picked up — refund processing');

        return response()->json(['status' => 'success', 'data' => $return->fresh()]);
    }

    /**
     * Admin: issue the refund. Wallet refunds are instant; source refunds go
     * through the payment gateway. Restocks the returned units either way.
     */
    public function refund(
        Request $request,
        $id,
        PaymentGateway $payments,
        NotificationService $notifications,
    ) {
        $return = ReturnRequest::with(['user', 'order', 'orderItem.product'])->find($id);

        if (! $return) {
            return response()->json(['status' => 'error', 'message' => 'Return not found'], 404);
        }

        if ($return->refund_status === 'COMPLETED') {
            return response()->json(['status' => 'error', 'message' => 'This return has already been actioned.'], 422);
        }

        DB::transaction(function () use ($return, $request, $payments, $notifications) {
            // Return the units to sellable stock.
            if ($return->orderItem->variant_id) {
                \App\Models\ProductVariant::where('id', $return->orderItem->variant_id)
                    ->increment('stock', $return->quantity);
            }

            if ($return->kind === 'EXCHANGE') {
                // Auto-reorder for exchange
                $exchangeVariant = \App\Models\ProductVariant::find($return->exchange_variant_id);
                if ($exchangeVariant) {
                    $exchangeVariant->decrement('stock', $return->quantity);
                    
                    // Create zero-dollar exchange order
                    $newOrder = \App\Models\Order::create([
                        'order_number' => 'EXC-' . strtoupper(Str::random(8)),
                        'user_id' => $return->user_id,
                        'address_id' => $return->order->address_id,
                        'subtotal' => 0,
                        'discount_total' => 0,
                        'wallet_applied' => 0,
                        'shipping_fee' => 0,
                        'total' => 0,
                        'status' => 'PLACED',
                        'payment_method' => 'EXCHANGE',
                        'payment_status' => 'PAID',
                    ]);

                    \App\Models\OrderItem::create([
                        'order_id' => $newOrder->id,
                        'product_id' => $return->orderItem->product_id,
                        'variant_id' => $exchangeVariant->id,
                        'quantity' => $return->quantity,
                        'price' => 0,
                        'subtotal' => 0,
                    ]);

                    $notifications->refundUpdate(
                        $return,
                        "Exchange processed successfully. New order {$newOrder->order_number} has been created."
                    );
                }
            } else {
                $mode = $request->input('refund_mode', $return->refund_mode ?? 'SOURCE');
                $amount = (float) $return->refund_amount;

                if ($mode === 'WALLET') {
                    \App\Http\Controllers\Api\WalletController::apply(
                        $return->user,
                        'CREDIT',
                        $amount,
                        "Refund for {$return->rma_number}",
                        'RETURN',
                        $return->id,
                    );
                } else {
                    $payments->refund($return->order, $amount, "Return {$return->rma_number}");
                }

                $notifications->refundUpdate(
                    $return,
                    $mode === 'WALLET'
                        ? 'refunded ₹'.number_format($amount, 2).' to your wallet'
                        : 'refunded ₹'.number_format($amount, 2).' to your original payment method (5–7 business days)',
                );
            }

            $return->update([
                'status' => $return->kind === 'EXCHANGE' ? 'EXCHANGED' : 'REFUNDED',
                'refund_status' => 'COMPLETED',
                'resolved_at' => now(),
            ]);
        });

        return response()->json(['status' => 'success', 'data' => $return->fresh()]);
    }
}
