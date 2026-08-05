<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Services\Contracts\LogisticsProvider;
use App\Services\Contracts\PaymentGateway;
use App\Services\LoyaltyService;
use App\Services\NotificationService;
use App\Services\ReferralService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Transactional, stock-checked checkout. Locks each variant row so two
     * simultaneous checkouts can't both oversell the last unit.
     */
    public function store(Request $request, NotificationService $notifications)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.variant_id' => 'nullable|uuid|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'shipping_address' => 'required|array',
            'shipping_address.name' => 'required|string',
            'shipping_address.phone' => 'required|string',
            'shipping_address.line1' => 'required|string',
            'shipping_address.city' => 'required|string',
            'shipping_address.state' => 'required|string',
            'shipping_address.pincode' => 'required|string',
            'payment_method' => 'required|in:UPI,CARD,NETBANKING,COD',
            'transaction_id' => 'nullable|string',
            'coupon_code' => 'nullable|string',
            'use_wallet' => 'nullable|boolean',
            'redeem_points' => 'nullable|integer|min:0',
            'service_level' => 'nullable|in:'.implode(',', \App\Services\Delivery\ServiceLevel::ALL),
        ]);

        $user = $request->user();
        $loyalty = app(LoyaltyService::class);

        try {
            $order = DB::transaction(function () use ($validated, $user, $loyalty) {
                $subtotal = 0;
                $orderItemsData = [];

                foreach ($validated['items'] as $item) {
                    $variant = null;

                    if (! empty($item['variant_id'])) {
                        $variant = ProductVariant::where('id', $item['variant_id'])->lockForUpdate()->first();
                    } else {
                        $variant = ProductVariant::where('product_id', $item['product_id'])->lockForUpdate()->first();
                    }

                    if (! $variant) {
                        abort(404, 'No purchasable variant found for product '.$item['product_id']);
                    }

                    if ($variant->stock < $item['quantity']) {
                        abort(400, "Insufficient stock for {$variant->product->title}");
                    }

                    $price = (float) $variant->effective_price;
                    $mrp = (float) $variant->effective_mrp;
                    $subtotal += $price * $item['quantity'];

                    $orderItemsData[] = [
                        'product_id' => $item['product_id'],
                        'variant_id' => $variant->id,
                        'quantity' => $item['quantity'],
                        'price' => $price,
                        'mrp' => $mrp,
                    ];

                    // COD has to be allowed for every product in the cart and
                    // for the destination pincode.
                    if ($validated['payment_method'] === 'COD' && ! $variant->product->cod_available) {
                        abort(422, "Cash on Delivery isn't available for {$variant->product->title}.");
                    }

                    $variant->decrement('stock', $item['quantity']);
                }

                if ($validated['payment_method'] === 'COD') {
                    $blocked = (array) Setting::get('cod.blocked_pincodes', []);
                    if (in_array($validated['shipping_address']['pincode'], $blocked, true)) {
                        abort(422, 'Cash on Delivery is not available at this pincode.');
                    }
                }

                // Coupon is re-validated here against server-side prices —
                // the client's quoted discount is never trusted.
                $discount = 0.0;
                $coupon = null;

                if (! empty($validated['coupon_code'])) {
                    $coupon = Coupon::whereRaw('UPPER(code) = ?', [strtoupper($validated['coupon_code'])])
                        ->lockForUpdate()
                        ->first();

                    if (! $coupon) {
                        abort(422, 'Invalid coupon code.');
                    }

                    $productIds = array_column($orderItemsData, 'product_id');
                    $categoryIds = \App\Models\Product::whereIn('id', $productIds)
                        ->pluck('category_id')->unique()->values()->all();

                    if ($error = $coupon->validateFor($user, $subtotal, $productIds, $categoryIds)) {
                        abort(422, $error);
                    }

                    $discount = $coupon->discountFor($subtotal);
                }

                // Delivery is re-quoted here rather than trusting whatever the
                // client showed at checkout. The quote the customer saw may be
                // minutes old, and the shipping fee is exactly the field worth
                // tampering with — so the server prices it, every time.
                $allocator = app(\App\Services\Delivery\DeliveryAllocator::class);
                $requestedLevel = $validated['service_level'] ?? \App\Services\Delivery\ServiceLevel::STANDARD;

                $shipmentProbe = $allocator->shipmentForCart(
                    items: array_map(
                        fn ($i) => ['product_id' => $i['product_id'], 'quantity' => $i['quantity']],
                        $validated['items'],
                    ),
                    dropPincode: $validated['shipping_address']['pincode'],
                    cod: $validated['payment_method'] === 'COD',
                    valuePaise: (int) round(($subtotal - $discount) * 100),
                );

                $chosenQuote = collect($allocator->quotes($shipmentProbe))
                    ->firstWhere('serviceLevel', $requestedLevel);

                if (! $chosenQuote) {
                    // The requested speed is no longer available to this
                    // address. Fall back to the slowest option that is, rather
                    // than failing an otherwise-good order.
                    $chosenQuote = collect($allocator->quotes($shipmentProbe))->last();
                }

                if (! $chosenQuote) {
                    throw ValidationException::withMessages([
                        'shipping_address' => ['We cannot deliver to this pincode right now.'],
                    ]);
                }

                $deliveryLevel = $chosenQuote->serviceLevel;
                $shipping = $chosenQuote->pricePaise / 100;

                // Free shipping applies to the standard tier only — a rider
                // delivery in 40 minutes is not something an order value earns.
                if ($deliveryLevel === \App\Services\Delivery\ServiceLevel::STANDARD
                    && ($subtotal - $discount) >= (int) config('delivery.free_above')) {
                    $shipping = 0.0;
                }

                $total = max(0, $subtotal - $discount + $shipping);

                // Loyalty points are redeemed against the payable amount, and
                // re-capped server-side so a tampered client can't over-redeem.
                $pointsRedeemed = 0;
                if (! empty($validated['redeem_points'])) {
                    $pointsRedeemed = min(
                        (int) $validated['redeem_points'],
                        $loyalty->maxRedeemablePoints($user->fresh(), $total)
                    );

                    if ($pointsRedeemed > 0) {
                        $pointsDiscount = $loyalty->pointsToRupees($pointsRedeemed);
                        $loyalty->redeem($user, $pointsRedeemed, 'Redeemed at checkout');
                        $discount += $pointsDiscount;
                        $total = max(0, $total - $pointsDiscount);
                    }
                }

                // Wallet is applied last, against the final payable amount.
                $walletApplied = 0.0;
                if (! empty($validated['use_wallet'])) {
                    $walletApplied = min((float) $user->fresh()->wallet_balance, $total);
                    if ($walletApplied > 0) {
                        WalletController::apply(
                            $user,
                            'DEBIT',
                            $walletApplied,
                            'Applied to order',
                            'ORDER',
                            null,
                        );
                        $total -= $walletApplied;
                    }
                }

                $order = Order::create([
                    'order_number' => 'ORD-'.strtoupper(Str::random(8)),
                    'user_id' => $user->id,
                    'status' => 'CONFIRMED',
                    'payment_status' => $validated['payment_method'] === 'COD' ? 'PENDING' : 'PAID',
                    'payment_method' => $validated['payment_method'],
                    'transaction_id' => $validated['transaction_id'] ?? null,
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'shipping_charge' => $shipping,
                    'total_amount' => $total,
                    'wallet_applied' => $walletApplied,
                    'coupon_id' => $coupon?->id,
                    'coupon_code' => $coupon?->code,
                    'shipping_address' => $validated['shipping_address'],
                    'points_redeemed' => $pointsRedeemed,
                    'points_earned' => $loyalty->pointsFor($total),
                    // What we promised and who we intend to hand it to. Stored
                    // so a late delivery can be attributed to a carrier rather
                    // than argued about.
                    'carrier' => $chosenQuote->carrier,
                    'service_level' => $deliveryLevel,
                    'delivery_fee_paise' => (int) round($shipping * 100),
                    'promised_by' => now()->addMinutes($chosenQuote->etaMinutes),
                ]);

                foreach ($orderItemsData as $data) {
                    $order->items()->create($data);
                }

                if ($coupon) {
                    $coupon->increment('used_count');
                    CouponRedemption::create([
                        'coupon_id' => $coupon->id,
                        'user_id' => $user->id,
                        'order_id' => $order->id,
                        'discount_amount' => $discount,
                    ]);
                }

                // Points earned on the order, and referral payout if this is
                // the referee's first qualifying purchase.
                if ($order->points_earned > 0) {
                    $loyalty->credit($user, $order->points_earned, "Earned on order {$order->order_number}", $order);
                }

                app(ReferralService::class)->rewardOnFirstOrder($order);

                return $order;
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $status = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
                ? $e->getStatusCode()
                : 500;

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], $status);
        }

        $notifications->orderPlaced($order->load('user'));

        return response()->json([
            'status' => 'success',
            'message' => 'Order placed successfully',
            'data' => $order->load('items.product', 'items.variant'),
        ], 201);
    }

    /** Admin: list every order. */
    public function index(Request $request)
    {
        $query = Order::with(['user', 'items.product'])->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->get();

        return response()->json(['status' => 'success', 'count' => $orders->count(), 'data' => $orders]);
    }

    /** Customer: their own order history. */
    public function mine(Request $request)
    {
        $orders = Order::with('items.product')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['status' => 'success', 'count' => $orders->count(), 'data' => $orders]);
    }

    public function show(Request $request, $id)
    {
        $order = Order::with(['user', 'items.product', 'items.variant'])->find($id);

        if (! $order) {
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        if (! $request->user()->isAdmin() && $order->user_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
        }

        return response()->json(['status' => 'success', 'data' => $order]);
    }

    /** Admin: update fulfillment status / courier / tracking. */
    public function update(Request $request, $id, NotificationService $notifications)
    {
        $order = Order::with('user')->find($id);

        if (! $order) {
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:PENDING,CONFIRMED,PACKED,SHIPPED,OUT_FOR_DELIVERY,DELIVERED,CANCELLED',
            'payment_status' => 'sometimes|in:PENDING,PAID,FAILED,REFUNDED',
            'courier' => 'nullable|string',
            'tracking_no' => 'nullable|string',
            'label_generated' => 'nullable|boolean',
        ]);

        // Stamp delivery time so the return window has a real start date.
        if (($validated['status'] ?? null) === 'DELIVERED' && ! $order->delivered_at) {
            $validated['delivered_at'] = now();
        }

        $previousStatus = $order->status;
        $order->update($validated);

        if (isset($validated['status']) && $validated['status'] !== $previousStatus) {
            $notifications->orderStatusChanged($order, $validated['status']);
        }

        return response()->json(['status' => 'success', 'data' => $order->fresh()]);
    }

    /**
     * Customer: cancel before dispatch. Restocks the units, refunds any wallet
     * amount used, and releases the coupon redemption.
     */
    public function cancel(Request $request, $id, NotificationService $notifications)
    {
        $order = Order::with(['items', 'user'])->find($id);

        if (! $order) {
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        if (! $request->user()->isAdmin() && $order->user_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
        }

        if (! $order->isCancellable()) {
            return response()->json([
                'status' => 'error',
                'message' => 'This order has already been dispatched and can no longer be cancelled.',
            ], 422);
        }

        $validated = $request->validate(['reason' => 'nullable|string|max:500']);

        DB::transaction(function () use ($order, $validated) {
            foreach ($order->items as $item) {
                if ($item->variant_id) {
                    ProductVariant::where('id', $item->variant_id)->increment('stock', $item->quantity);
                }
            }

            if ((float) $order->wallet_applied > 0) {
                WalletController::apply(
                    $order->user,
                    'CREDIT',
                    (float) $order->wallet_applied,
                    "Cancellation refund for {$order->order_number}",
                    'ORDER',
                    $order->id,
                );
            }

            if ($order->coupon_id) {
                Coupon::where('id', $order->coupon_id)->where('used_count', '>', 0)->decrement('used_count');
                CouponRedemption::where('order_id', $order->id)->delete();
            }

            $order->update([
                'status' => 'CANCELLED',
                'payment_status' => $order->payment_status === 'PAID' ? 'REFUNDED' : $order->payment_status,
                'cancellation_reason' => $validated['reason'] ?? 'Cancelled by customer',
                'cancelled_at' => now(),
            ]);
        });

        $notifications->orderStatusChanged($order->fresh(), 'CANCELLED');

        return response()->json(['status' => 'success', 'data' => $order->fresh()]);
    }

    /** Live courier tracking for an order (mock provider in this environment). */
    public function track(Request $request, $id, LogisticsProvider $logistics)
    {
        $order = Order::find($id);

        if (! $order) {
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        if (! $request->user()->isAdmin() && $order->user_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
        }

        if (! $order->tracking_no) {
            return response()->json([
                'status' => 'success',
                'data' => ['tracking_no' => null, 'message' => 'Not dispatched yet.'],
            ]);
        }

        return response()->json(['status' => 'success', 'data' => $logistics->track($order->tracking_no)]);
    }

    /** Admin: generate a courier shipment + label. */
    public function createShipment($id, LogisticsProvider $logistics)
    {
        $order = Order::find($id);

        if (! $order) {
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        $shipment = $logistics->createShipment($order);

        $order->update([
            'courier' => $shipment['courier'],
            'tracking_no' => $shipment['tracking_no'],
            'label_generated' => true,
        ]);

        return response()->json(['status' => 'success', 'data' => $order->fresh(), 'shipment' => $shipment]);
    }

    /** Invoice data — the frontend renders/prints this as a PDF. */
    public function invoice(Request $request, $id)
    {
        $order = Order::with(['items.product', 'items.variant', 'user'])->find($id);

        if (! $order) {
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        if (! $request->user()->isAdmin() && $order->user_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Forbidden'], 403);
        }

        // GST is shown as extracted from the (tax-inclusive) selling price,
        // matching how the storefront advertises "inclusive of all taxes".
        $taxRate = 0.18;
        $taxable = round((float) $order->subtotal / (1 + $taxRate), 2);
        $tax = round((float) $order->subtotal - $taxable, 2);

        return response()->json([
            'status' => 'success',
            'data' => [
                'invoice_number' => 'INV-'.$order->order_number,
                'issued_at' => $order->created_at->toDateString(),
                'seller' => [
                    'name' => 'BharatPulse Marketplace Technologies Pvt Ltd',
                    'gstin' => '29AABCU9603R1ZX',
                    'address' => 'HSR Layout, Bengaluru, Karnataka 560102',
                ],
                'order' => $order,
                'totals' => [
                    'taxable_value' => $taxable,
                    'gst' => $tax,
                    'gst_rate' => '18%',
                    'subtotal' => (float) $order->subtotal,
                    'discount' => (float) $order->discount,
                    'shipping' => (float) $order->shipping_charge,
                    'wallet_applied' => (float) $order->wallet_applied,
                    'grand_total' => (float) $order->total_amount,
                ],
            ],
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $order = Order::find($id);

        if (! $order) {
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        $order->delete();

        return response()->json(['status' => 'success', 'message' => 'Order deleted']);
    }
}
