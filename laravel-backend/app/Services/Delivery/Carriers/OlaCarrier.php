<?php

namespace App\Services\Delivery\Carriers;

use App\Models\Order;
use App\Services\Delivery\DeliveryQuote;
use App\Services\Delivery\ServiceLevel;
use App\Services\Delivery\Shipment;

/**
 * Ola — rider network, intracity only.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOT LIVE. Ola's logistics/delivery API is partner-gated in the same way
 * Rapido's is — enterprise agreement, onboarding, then credentials and docs.
 * There is no self-serve sandbox to point this at.
 *
 * It exists as a separate adapter rather than being folded into Rapido on
 * purpose: two rider networks with overlapping coverage is the entire reason
 * the allocator rate-shops. When both are live, whichever quotes cheaper for a
 * given shipment wins that shipment, automatically.
 *
 * `mapQuoteResponse` and `bookingPayload` are the two methods to correct
 * against the real spec.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class OlaCarrier extends BaseCarrier
{
    public function key(): string
    {
        return 'ola';
    }

    public function supportedServiceLevels(): array
    {
        return [ServiceLevel::INSTANT, ServiceLevel::SAME_DAY];
    }

    public function isConfigured(): bool
    {
        return filled($this->config['client_id'] ?? null)
            && filled($this->config['client_secret'] ?? null);
    }

    public function quote(Shipment $shipment): array
    {
        if (! $this->isConfigured()) {
            return [
                $this->sandboxQuote($shipment, ServiceLevel::INSTANT, 'Ola — Bike'),
            ];
        }

        try {
            $response = $this->http($this->authHeaders())->post($this->baseUrl().'/estimates', [
                'pickup_pincode' => $shipment->pickupPincode,
                'drop_pincode' => $shipment->dropPincode,
                'weight_kg' => round($shipment->billableGrams() / 1000, 2),
            ]);

            return $response->successful() ? $this->mapQuoteResponse($response->json()) : [];
        } catch (\Throwable $e) {
            $this->logFailure('quote', $e, ['shipment' => $shipment->toArray()]);

            return [];
        }
    }

    /** CONFIRM AGAINST THE PARTNER SPEC. */
    protected function mapQuoteResponse(array $body): array
    {
        $quotes = [];

        foreach ($body['estimates'] ?? [] as $estimate) {
            $eta = (int) ($estimate['eta_minutes'] ?? 90);

            $quotes[] = new DeliveryQuote(
                carrier: $this->key(),
                carrierLabel: 'Ola — '.($estimate['category'] ?? 'Bike'),
                serviceLevel: $eta <= 120 ? ServiceLevel::INSTANT : ServiceLevel::SAME_DAY,
                pricePaise: (int) round(($estimate['amount'] ?? 0) * 100),
                etaMinutes: $eta,
                codSupported: false,
                serviceCode: $estimate['category'] ?? null,
                raw: $estimate,
            );
        }

        return $quotes;
    }

    public function book(Order $order, string $serviceLevel): array
    {
        if (! $this->isConfigured()) {
            return $this->sandboxBooking($order, $serviceLevel);
        }

        $response = $this->http($this->authHeaders())
            ->post($this->baseUrl().'/bookings', $this->bookingPayload($order));

        if ($response->failed()) {
            throw new \RuntimeException('Ola rejected the booking: '.$response->body());
        }

        $body = $response->json();

        return [
            'carrier' => $this->key(),
            'courier' => 'Ola',
            'service_level' => $serviceLevel,
            'tracking_no' => $body['booking_id'] ?? null,
            'label_url' => null,
            'sandbox' => false,
        ];
    }

    /** CONFIRM AGAINST THE PARTNER SPEC. */
    protected function bookingPayload(Order $order): array
    {
        $pickup = config('delivery.pickup_address');
        $drop = $order->shipping_address;

        return [
            'reference' => $order->order_number,
            'pickup' => [
                'lat' => $pickup['lat'],
                'lng' => $pickup['lng'],
                'contact_name' => $pickup['name'],
                'contact_phone' => $pickup['phone'],
            ],
            'drop' => [
                'address' => trim(($drop['line1'] ?? '').' '.($drop['line2'] ?? '')),
                'pincode' => $drop['pincode'] ?? '',
                'contact_name' => $drop['name'] ?? '',
                'contact_phone' => $drop['phone'] ?? '',
            ],
        ];
    }

    public function track(string $trackingNo): array
    {
        if (! $this->isConfigured()) {
            return [
                'tracking_no' => $trackingNo,
                'carrier' => $this->key(),
                'current_status' => 'OUT_FOR_DELIVERY',
                'eta_minutes' => 35,
                'sandbox' => true,
            ];
        }

        $response = $this->http($this->authHeaders())->get($this->baseUrl().'/bookings/'.$trackingNo);

        $body = $response->successful() ? $response->json() : [];

        return [
            'tracking_no' => $trackingNo,
            'carrier' => $this->key(),
            'current_status' => $body['status'] ?? 'IN_TRANSIT',
            'position' => [
                'lat' => $body['driver']['lat'] ?? null,
                'lng' => $body['driver']['lng'] ?? null,
            ],
            'eta_minutes' => $body['eta_minutes'] ?? null,
            'sandbox' => false,
        ];
    }

    private function authHeaders(): array
    {
        return [
            'X-App-Token' => $this->config['client_id'],
            'Authorization' => 'Bearer '.$this->config['client_secret'],
        ];
    }
}
