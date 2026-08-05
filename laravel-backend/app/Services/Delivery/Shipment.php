<?php

namespace App\Services\Delivery;

use App\Models\Order;

/**
 * Everything a carrier needs to quote or book, independent of which carrier it is.
 *
 * This exists so the allocator and the adapters share one vocabulary. Without it
 * every adapter reaches into Order and the address array itself, and the moment
 * one of them reads a field slightly differently — grams vs kilograms is the
 * classic — you get a carrier that silently quotes the wrong price.
 */
class Shipment
{
    public function __construct(
        public readonly string $pickupPincode,
        public readonly string $dropPincode,
        /** Total billable weight in grams. */
        public readonly int $weightGrams,
        /** Largest single dimension in cm, used for oversize rules. */
        public readonly int $longestSideCm,
        /** Sum of L+W+H in cm, used for volumetric checks. */
        public readonly int $girthCm,
        /** Declared value in paise — carriers price insurance off this. */
        public readonly int $valuePaise,
        public readonly bool $cod,
        public readonly int $itemCount,
        public readonly ?Order $order = null,
    ) {}

    /**
     * Volumetric weight, the number couriers actually bill on when a parcel is
     * light but bulky. 5000 is the divisor Indian surface carriers use; air is
     * harsher but we do not book air here.
     */
    public function volumetricGrams(int $divisor = 5000): int
    {
        // We only carry the longest side and girth, so approximate the box as
        // longest × (remaining girth split evenly). Deliberately conservative:
        // under-estimating volumetric weight is what produces surprise
        // post-delivery weight-discrepancy charges from the carrier.
        $remaining = max(0, $this->girthCm - $this->longestSideCm);
        $side = $remaining / 2;

        return (int) round(($this->longestSideCm * $side * $side) / $divisor * 1000);
    }

    /** What a carrier bills on: the greater of actual and volumetric. */
    public function billableGrams(): int
    {
        return max($this->weightGrams, $this->volumetricGrams());
    }

    public function isIntracity(): bool
    {
        // Same first three digits of the PIN is the same sorting district, which
        // is a good enough proxy for "a bike can do this in an hour". It is not
        // exact — a district can span 60km — so carriers still get to reject it
        // at quote time.
        return substr($this->pickupPincode, 0, 3) === substr($this->dropPincode, 0, 3);
    }

    public function toArray(): array
    {
        return [
            'pickup_pincode' => $this->pickupPincode,
            'drop_pincode' => $this->dropPincode,
            'weight_grams' => $this->weightGrams,
            'billable_grams' => $this->billableGrams(),
            'longest_side_cm' => $this->longestSideCm,
            'girth_cm' => $this->girthCm,
            'value_paise' => $this->valuePaise,
            'cod' => $this->cod,
            'item_count' => $this->itemCount,
            'intracity' => $this->isIntracity(),
        ];
    }
}
