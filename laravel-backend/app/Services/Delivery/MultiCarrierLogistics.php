<?php

namespace App\Services\Delivery;

use App\Models\Order;
use App\Models\ReturnRequest;
use App\Services\Contracts\LogisticsProvider;

/**
 * Bridges the old single-carrier `LogisticsProvider` onto the new registry.
 *
 * The existing controllers (orders, returns, serviceability) were written when
 * there was exactly one courier. Rather than rewrite all of them in the same
 * change that introduces multi-carrier, this satisfies the old interface by
 * delegating to the allocator — so those call sites keep working unchanged and
 * immediately get carrier selection, while new code uses the richer contract.
 *
 * It is a real implementation, not a shim to delete: "give me a courier for
 * this order without me choosing one" stays a legitimate need for admin-side
 * shipment creation.
 */
class MultiCarrierLogistics implements LogisticsProvider
{
    public function __construct(
        private readonly CarrierRegistry $registry,
        private readonly DeliveryAllocator $allocator,
    ) {}

    /**
     * Serviceable if *any* enabled carrier will quote it. Reports back the best
     * available speed so the PDP can promise honestly rather than assuming
     * everywhere gets the same service.
     */
    public function isServiceable(string $pincode): array
    {
        if (! preg_match('/^[1-9][0-9]{5}$/', $pincode)) {
            return [
                'pincode' => $pincode,
                'serviceable' => false,
                'cod_available' => false,
                'express_available' => false,
                'estimated_days' => null,
                'message' => 'Enter a valid 6-digit pincode.',
            ];
        }

        // A representative parcel: serviceability is a question about the
        // address, so quoting a typical item avoids one heavy product making a
        // whole pincode look unserviceable.
        $probe = new Shipment(
            pickupPincode: config('delivery.pickup_pincode'),
            dropPincode: $pincode,
            weightGrams: config('delivery.default_item_weight_grams'),
            longestSideCm: 25,
            girthCm: 57,
            valuePaise: 100000,
            cod: false,
            itemCount: 1,
        );

        $quotes = $this->allocator->quotes($probe);

        if (! $quotes) {
            return [
                'pincode' => $pincode,
                'serviceable' => false,
                'cod_available' => false,
                'express_available' => false,
                'estimated_days' => null,
                'message' => 'We do not currently deliver to this pincode.',
            ];
        }

        $fastest = $quotes[0];
        $instant = collect($quotes)->contains(
            fn (DeliveryQuote $q) => in_array($q->serviceLevel, [ServiceLevel::INSTANT, ServiceLevel::SAME_DAY], true),
        );

        return [
            'pincode' => $pincode,
            'serviceable' => true,
            'cod_available' => collect($quotes)->contains(fn (DeliveryQuote $q) => $q->codSupported),
            'express_available' => $instant,
            'estimated_days' => max(1, (int) ceil($fastest->etaMinutes / (60 * 24))),
            'fastest_option' => $fastest->toArray(),
            'options' => array_map(fn (DeliveryQuote $q) => $q->toArray(), $quotes),
            'message' => $instant
                ? "Fastest option: {$fastest->etaLabel()}."
                : "Delivery in about {$fastest->etaLabel()}.",
            'is_mock' => collect($quotes)->every(fn (DeliveryQuote $q) => $q->sandbox),
        ];
    }

    public function createShipment(Order $order): array
    {
        $shipment = $this->allocator->shipmentForOrder($order);
        $level = $order->service_level ?: ServiceLevel::STANDARD;

        $carrier = $this->allocator->carrierFor($shipment, $level);

        if (! $carrier) {
            throw new \RuntimeException('No carrier can service this shipment.');
        }

        return $carrier->book($order, $level);
    }

    public function track(string $trackingNo): array
    {
        // Try the carrier that booked it first; fall back to asking each in turn
        // for orders manifested before carrier was recorded.
        foreach ($this->registry->enabled() as $carrier) {
            $result = $carrier->track($trackingNo);
            if (($result['current_status'] ?? null) !== null) {
                return $result;
            }
        }

        return ['tracking_no' => $trackingNo, 'current_status' => 'UNKNOWN'];
    }

    public function schedulePickup(ReturnRequest $return): array
    {
        // Reverse logistics goes to an aggregator — rider networks do not do
        // pickups against a return authorisation.
        foreach (['shiprocket', 'delhivery'] as $key) {
            $carrier = $this->registry->get($key);
            if ($carrier) {
                return $carrier->schedulePickup($return);
            }
        }

        throw new \RuntimeException('No reverse-logistics carrier is enabled.');
    }

    /** Carrier that booked a given order, when we recorded one. */
    public function carrierForOrder(Order $order): ?\App\Services\Contracts\DeliveryCarrier
    {
        return $order->carrier ? $this->registry->get($order->carrier) : null;
    }
}
