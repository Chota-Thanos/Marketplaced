<?php

namespace App\Services\Contracts;

use App\Models\Order;
use App\Models\ReturnRequest;
use App\Services\Delivery\Shipment;

/**
 * One delivery partner.
 *
 * Replaces the old single-carrier LogisticsProvider, which assumed there was
 * exactly one courier and that it was Shiprocket. Real Indian fulfilment is
 * several partners at once — a rider network for intracity, a 3PL aggregator
 * for the rest, a truck operator for anything heavy — chosen per shipment.
 *
 * Every method must degrade rather than throw: an outage at one partner should
 * cost that partner its slot in the quote list, not take checkout down.
 */
interface DeliveryCarrier
{
    /** Stable machine key: 'porter', 'rapido', 'ola', 'shiprocket', 'delhivery'. */
    public function key(): string;

    /** Human name shown next to a quote. */
    public function label(): string;

    /** Service levels this carrier can ever offer. Cheap, static, no I/O. */
    public function supportedServiceLevels(): array;

    /**
     * True when credentials are present. A carrier without credentials still
     * appears in the registry — it just quotes in sandbox mode and is labelled
     * as such, so a demo works and nobody mistakes it for a live booking.
     */
    public function isConfigured(): bool;

    /**
     * Can this carrier physically do this shipment? Weight limits, intracity
     * only, pincode coverage. Pure logic where possible so the allocator can
     * shortlist without a network call per carrier.
     */
    public function canCarry(Shipment $shipment): bool;

    /**
     * Price and ETA options for this shipment. Returns zero or more
     * DeliveryQuote. Must catch its own transport errors and return [].
     *
     * @return \App\Services\Delivery\DeliveryQuote[]
     */
    public function quote(Shipment $shipment): array;

    /** Book it. Returns tracking number, label URL, courier name. */
    public function book(Order $order, string $serviceLevel): array;

    public function track(string $trackingNo): array;

    public function cancel(string $trackingNo): array;

    public function schedulePickup(ReturnRequest $return): array;
}
