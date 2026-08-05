<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Delivery\CarrierRegistry;
use App\Services\Delivery\DeliveryAllocator;
use App\Services\Delivery\DeliveryQuote;
use App\Services\Delivery\ServiceLevel;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function __construct(
        private readonly DeliveryAllocator $allocator,
        private readonly CarrierRegistry $registry,
    ) {}

    /**
     * Delivery options for a cart, before an order exists.
     *
     * The client sends what it has (items and a destination); the server does
     * the weighing, the carrier shortlisting and the pricing. Deliberately not
     * trusting a client-supplied weight — that is the number the shipping fee
     * is computed from, and it is exactly the field someone would tamper with.
     */
    public function quote(Request $request)
    {
        $validated = $request->validate([
            'pincode' => 'required|string|regex:/^[1-9][0-9]{5}$/',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1|max:50',
            'cod' => 'sometimes|boolean',
            'order_value' => 'sometimes|numeric|min:0',
        ]);

        $shipment = $this->allocator->shipmentForCart(
            items: $validated['items'],
            dropPincode: $validated['pincode'],
            cod: (bool) ($validated['cod'] ?? false),
            valuePaise: (int) round((float) ($validated['order_value'] ?? 0) * 100),
        );

        $quotes = $this->allocator->quotes($shipment);

        // Free shipping is a merchandising decision, not a carrier one: we still
        // pay the courier, we just don't pass it on. Applied to the standard
        // option only — someone choosing a 40-minute rider delivery is not
        // expecting that to be free because they spent ₹2,000.
        $freeAbove = (int) config('delivery.free_above');
        $orderValue = (float) ($validated['order_value'] ?? 0);

        $options = array_map(function (DeliveryQuote $q) use ($freeAbove, $orderValue) {
            $row = $q->toArray();
            $row['label'] = ServiceLevel::label($q->serviceLevel);
            $row['description'] = ServiceLevel::description($q->serviceLevel);

            if ($q->serviceLevel === ServiceLevel::STANDARD && $orderValue >= $freeAbove) {
                $row['price_paise'] = 0;
                $row['price'] = 0;
                $row['free_reason'] = "Free on orders over ₹{$freeAbove}";
            }

            return $row;
        }, $quotes);

        return response()->json([
            'status' => 'success',
            'data' => [
                'pincode' => $validated['pincode'],
                'serviceable' => count($options) > 0,
                'options' => $options,
                'shipment' => $shipment->toArray(),
                // Surfaced so the UI can badge sandbox pricing honestly rather
                // than presenting invented numbers as real quotes.
                'sandbox' => ! $this->registry->hasLiveCarrier(),
            ],
        ]);
    }

    /**
     * Live tracking for an order, asked of the carrier that actually booked it.
     */
    public function track(Request $request, string $id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if (! $order->tracking_no) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'tracking_no' => null,
                    'current_status' => $order->status,
                    'message' => 'Not dispatched yet — tracking appears once the courier collects it.',
                ],
            ]);
        }

        $carrier = $order->carrier ? $this->registry->get($order->carrier) : null;

        $tracking = $carrier
            ? $carrier->track($order->tracking_no)
            : ['tracking_no' => $order->tracking_no, 'current_status' => $order->status];

        return response()->json([
            'status' => 'success',
            'data' => $tracking + [
                'order_status' => $order->status,
                'service_level' => $order->service_level,
                'service_label' => ServiceLevel::label($order->service_level ?? ServiceLevel::STANDARD),
                'promised_by' => $order->promised_by?->toIso8601String(),
                'courier' => $order->courier,
            ],
        ]);
    }

    /**
     * Which partners this deployment can book with, and whether each is live.
     * Admin-facing: the answer to "why did that ship with Porter".
     */
    public function carriers()
    {
        return response()->json([
            'status' => 'success',
            'data' => collect($this->registry->enabled())->map(fn ($c) => [
                'key' => $c->key(),
                'label' => $c->label(),
                'service_levels' => $c->supportedServiceLevels(),
                'configured' => $c->isConfigured(),
                'mode' => $c->isConfigured() ? 'live' : 'sandbox',
            ])->values(),
        ]);
    }
}
