<?php

namespace App\Services\Delivery\Carriers;

use App\Models\Order;
use App\Models\ReturnRequest;
use App\Services\Contracts\DeliveryCarrier;
use App\Services\Delivery\DeliveryQuote;
use App\Services\Delivery\ServiceLevel;
use App\Services\Delivery\Shipment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Shared plumbing for every carrier adapter.
 *
 * Two things live here that would otherwise be copy-pasted five times and drift:
 *
 *   1. The envelope check (weight, size, intracity) driven off config, so the
 *      allocator can shortlist carriers without a network round trip each.
 *   2. Sandbox behaviour. A carrier with no credentials still quotes and books
 *      — with `sandbox: true` on every response — so the whole flow is testable
 *      before contracts land, and nothing can be mistaken for a real booking.
 */
abstract class BaseCarrier implements DeliveryCarrier
{
    protected array $config;

    public function __construct()
    {
        $this->config = config("delivery.carriers.{$this->key()}", []);
    }

    public function label(): string
    {
        return $this->config['label'] ?? ucfirst($this->key());
    }

    public function canCarry(Shipment $shipment): bool
    {
        $billable = $shipment->billableGrams();

        if ($billable > ($this->config['max_weight_grams'] ?? PHP_INT_MAX)) {
            return false;
        }

        if ($shipment->longestSideCm > ($this->config['max_longest_side_cm'] ?? PHP_INT_MAX)) {
            return false;
        }

        if (($this->config['intracity_only'] ?? false) && ! $shipment->isIntracity()) {
            return false;
        }

        // Offering a COD option the carrier will not collect produces an order
        // nobody can hand over at the door.
        if ($shipment->cod && ! ($this->config['cod'] ?? true)) {
            return false;
        }

        return true;
    }

    // ── HTTP ────────────────────────────────────────────────────────────────

    protected function baseUrl(): string
    {
        return rtrim($this->config['base_url'] ?? '', '/');
    }

    /**
     * Every partner call goes through here so timeouts, retries and error
     * logging are uniform. Short timeout on purpose: a slow carrier must not
     * hold the checkout page open — it just loses its slot in the quote list.
     */
    protected function http(array $headers = [])
    {
        return Http::withHeaders($headers)
            ->timeout((int) config('delivery.http_timeout', 6))
            ->connectTimeout(3)
            ->retry(2, 250, throw: false)
            ->acceptJson();
    }

    protected function logFailure(string $operation, \Throwable $e, array $context = []): void
    {
        Log::warning("[{$this->key()}] {$operation} failed", [
            'error' => $e->getMessage(),
        ] + $context);
    }

    // ── Sandbox ─────────────────────────────────────────────────────────────

    /**
     * Straight-line distance between two pincodes, approximated from their
     * numeric distance. Good enough to make sandbox pricing vary sensibly with
     * how far apart two places are; it is not a real distance and never leaves
     * sandbox mode.
     */
    protected function approximateKm(Shipment $shipment): float
    {
        $delta = abs((int) $shipment->pickupPincode - (int) $shipment->dropPincode);

        if ($shipment->isIntracity()) {
            return round(2 + ($delta % 25), 1);
        }

        return round(min(2200, 120 + $delta / 40), 1);
    }

    protected function sandboxQuote(Shipment $shipment, string $serviceLevel, string $variantLabel = null): DeliveryQuote
    {
        $rates = config('delivery.sandbox_rates');
        $km = $this->approximateKm($shipment);
        $kg = $shipment->billableGrams() / 1000;

        $price = match ($serviceLevel) {
            ServiceLevel::INSTANT => $rates['instant_base_paise'] + (int) ($km * $rates['instant_per_km_paise']),
            ServiceLevel::SAME_DAY => $rates['same_day_base_paise'] + (int) ($km * 200),
            ServiceLevel::EXPRESS => $rates['express_base_paise'] + (int) (ceil($kg) * 2500),
            ServiceLevel::HEAVY => $rates['heavy_base_paise'] + (int) (ceil($kg) * $rates['heavy_per_kg_paise']),
            default => $rates['standard_base_paise'] + (int) (ceil($kg * 2) * $rates['standard_per_500g_paise']),
        };

        if ($shipment->cod) {
            $price += $rates['cod_fee_paise'];
        }

        $eta = match ($serviceLevel) {
            ServiceLevel::INSTANT => max(25, (int) ($km * 3.5) + 15),
            ServiceLevel::SAME_DAY => 8 * 60,
            ServiceLevel::EXPRESS => 24 * 60,
            ServiceLevel::HEAVY => 72 * 60,
            default => ($shipment->isIntracity() ? 2 : 4) * 24 * 60,
        };

        return new DeliveryQuote(
            carrier: $this->key(),
            carrierLabel: $variantLabel ?? $this->label(),
            serviceLevel: $serviceLevel,
            pricePaise: $price,
            etaMinutes: $eta,
            codSupported: $this->config['cod'] ?? true,
            sandbox: true,
        );
    }

    protected function sandboxBooking(Order $order, string $serviceLevel): array
    {
        $prefix = strtoupper(substr($this->key(), 0, 3));

        $booking = [
            'carrier' => $this->key(),
            'courier' => $this->label().' — '.ServiceLevel::label($serviceLevel),
            'service_level' => $serviceLevel,
            'tracking_no' => $prefix.random_int(10000000, 99999999).'IN',
            'label_url' => null,
            'sandbox' => true,
        ];

        Log::info("[{$this->key()}] SANDBOX booking (nothing was shipped)", $booking + [
            'order' => $order->order_number,
        ]);

        return $booking;
    }

    public function isConfigured(): bool
    {
        return false;
    }

    public function cancel(string $trackingNo): array
    {
        return ['cancelled' => true, 'tracking_no' => $trackingNo, 'sandbox' => true];
    }

    public function schedulePickup(ReturnRequest $return): array
    {
        return [
            'carrier' => $this->key(),
            'pickup_tracking_no' => 'RTN'.random_int(10000000, 99999999).'IN',
            'scheduled_for' => now()->addDays(2)->toDateString(),
            'sandbox' => true,
        ];
    }
}
