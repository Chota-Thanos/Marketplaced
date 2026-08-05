<?php

namespace App\Services\Delivery;

use App\Services\Contracts\DeliveryCarrier;

/**
 * The set of carriers this deployment can book with.
 *
 * Registered in AppServiceProvider from config('delivery.carriers'), so turning
 * a partner on or off after a contract lands is a config change, not a code
 * change.
 */
class CarrierRegistry
{
    /** @var DeliveryCarrier[] */
    private array $carriers = [];

    /** @param DeliveryCarrier[] $carriers */
    public function __construct(array $carriers = [])
    {
        foreach ($carriers as $carrier) {
            $this->register($carrier);
        }
    }

    public function register(DeliveryCarrier $carrier): void
    {
        $this->carriers[$carrier->key()] = $carrier;
    }

    /** @return DeliveryCarrier[] */
    public function all(): array
    {
        return array_values($this->carriers);
    }

    public function get(string $key): ?DeliveryCarrier
    {
        return $this->carriers[$key] ?? null;
    }

    /** @return DeliveryCarrier[] */
    public function enabled(): array
    {
        $enabled = config('delivery.enabled', []);

        return array_values(array_filter(
            $this->carriers,
            fn (DeliveryCarrier $c) => in_array($c->key(), $enabled, true),
        ));
    }

    /** True when at least one carrier has real credentials. */
    public function hasLiveCarrier(): bool
    {
        foreach ($this->enabled() as $carrier) {
            if ($carrier->isConfigured()) {
                return true;
            }
        }

        return false;
    }
}
