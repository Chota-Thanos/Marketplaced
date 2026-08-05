<?php

namespace App\Services\Delivery\Carriers;

use App\Models\Order;
use App\Services\Delivery\DeliveryQuote;
use App\Services\Delivery\ServiceLevel;
use App\Services\Delivery\Shipment;

/**
 * Rapido — two-wheeler rider network, intracity only.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOT LIVE. Rapido has no public or self-serve API. Access is granted through
 * their merchant/enterprise programme: you sign a commercial agreement, get
 * onboarded, and are then issued a client id/secret, a sandbox base URL and
 * their integration document.
 *
 * The request and response shapes below are the ones this adapter needs; they
 * are NOT copied from Rapido's documentation, because that document is issued
 * under NDA at onboarding. Treat `mapQuoteResponse` and `bookingPayload` as the
 * two places to correct once you have the real spec — everything else in the
 * codebase talks to this class, not to Rapido, so nothing else moves.
 *
 * Until `RAPIDO_CLIENT_ID` / `RAPIDO_CLIENT_SECRET` are set, this runs in
 * sandbox mode and every response carries `sandbox: true`.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class RapidoCarrier extends BaseCarrier
{
    public function key(): string
    {
        return 'rapido';
    }

    public function supportedServiceLevels(): array
    {
        // A bike does not do intercity, and it does not do next-week.
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
                $this->sandboxQuote($shipment, ServiceLevel::INSTANT, 'Rapido — Bike'),
                $this->sandboxQuote($shipment, ServiceLevel::SAME_DAY, 'Rapido — Bike'),
            ];
        }

        try {
            $response = $this->http($this->authHeaders())->post($this->baseUrl().'/delivery/quote', [
                'pickup' => ['pincode' => $shipment->pickupPincode],
                'drop' => ['pincode' => $shipment->dropPincode],
                'weight_grams' => $shipment->billableGrams(),
                'declared_value' => $shipment->valuePaise / 100,
            ]);

            if ($response->failed()) {
                return [];
            }

            return $this->mapQuoteResponse($response->json());
        } catch (\Throwable $e) {
            $this->logFailure('quote', $e, ['shipment' => $shipment->toArray()]);

            return [];
        }
    }

    /**
     * Translate Rapido's quote payload into DeliveryQuote objects.
     *
     * CONFIRM AGAINST THE PARTNER SPEC. Only this method and bookingPayload()
     * should need editing when the real field names are known.
     */
    protected function mapQuoteResponse(array $body): array
    {
        $quotes = [];

        foreach ($body['services'] ?? [] as $service) {
            $quotes[] = new DeliveryQuote(
                carrier: $this->key(),
                carrierLabel: 'Rapido — '.($service['vehicle_type'] ?? 'Bike'),
                serviceLevel: ($service['eta_minutes'] ?? 999) <= 120
                    ? ServiceLevel::INSTANT
                    : ServiceLevel::SAME_DAY,
                pricePaise: (int) round(($service['fare'] ?? 0) * 100),
                etaMinutes: (int) ($service['eta_minutes'] ?? 90),
                codSupported: false,
                serviceCode: $service['service_id'] ?? null,
                raw: $service,
            );
        }

        return $quotes;
    }

    public function book(Order $order, string $serviceLevel): array
    {
        if (! $this->isConfigured()) {
            return $this->sandboxBooking($order, $serviceLevel);
        }

        try {
            $response = $this->http($this->authHeaders())
                ->post($this->baseUrl().'/delivery/create', $this->bookingPayload($order));

            if ($response->failed()) {
                throw new \RuntimeException('Rapido rejected the booking: '.$response->body());
            }

            $body = $response->json();

            return [
                'carrier' => $this->key(),
                'courier' => 'Rapido',
                'service_level' => $serviceLevel,
                'tracking_no' => $body['order_id'] ?? $body['tracking_id'] ?? null,
                'label_url' => null,
                'sandbox' => false,
            ];
        } catch (\Throwable $e) {
            $this->logFailure('book', $e, ['order' => $order->order_number]);
            throw $e;
        }
    }

    /** CONFIRM AGAINST THE PARTNER SPEC. */
    protected function bookingPayload(Order $order): array
    {
        $pickup = config('delivery.pickup_address');
        $drop = $order->shipping_address;

        return [
            'reference_id' => $order->order_number,
            'pickup' => [
                'name' => $pickup['name'],
                'phone' => $pickup['phone'],
                'address' => $pickup['line1'],
                'pincode' => $pickup['pincode'],
                'lat' => $pickup['lat'],
                'lng' => $pickup['lng'],
            ],
            'drop' => [
                'name' => $drop['name'] ?? '',
                'phone' => $drop['phone'] ?? '',
                'address' => trim(($drop['line1'] ?? '').' '.($drop['line2'] ?? '')),
                'pincode' => $drop['pincode'] ?? '',
            ],
        ];
    }

    public function track(string $trackingNo): array
    {
        if (! $this->isConfigured()) {
            return $this->sandboxTrack($trackingNo);
        }

        try {
            $response = $this->http($this->authHeaders())
                ->get($this->baseUrl().'/delivery/'.$trackingNo.'/status');

            if ($response->failed()) {
                return $this->sandboxTrack($trackingNo);
            }

            $body = $response->json();

            return [
                'tracking_no' => $trackingNo,
                'carrier' => $this->key(),
                'current_status' => $body['status'] ?? 'IN_TRANSIT',
                'position' => [
                    'lat' => $body['rider']['lat'] ?? null,
                    'lng' => $body['rider']['lng'] ?? null,
                ],
                'eta_minutes' => $body['eta_minutes'] ?? null,
                'rider' => [
                    'name' => $body['rider']['name'] ?? null,
                    'phone' => $body['rider']['phone'] ?? null,
                ],
                'sandbox' => false,
            ];
        } catch (\Throwable $e) {
            $this->logFailure('track', $e, ['tracking_no' => $trackingNo]);

            return $this->sandboxTrack($trackingNo);
        }
    }

    /**
     * Deterministic synthetic position — seeded from the tracking number and
     * advanced by wall-clock, so the marker moves consistently between polls
     * instead of jumping about. Labelled sandbox so the UI never badges it LIVE.
     */
    private function sandboxTrack(string $trackingNo): array
    {
        $progress = ((crc32($trackingNo) % 40) + (int) (now()->timestamp / 60) % 60) % 100 / 100;

        $from = ['lat' => 12.9121, 'lng' => 77.6446];
        $to = ['lat' => 12.9352, 'lng' => 77.6245];

        return [
            'tracking_no' => $trackingNo,
            'carrier' => $this->key(),
            'current_status' => $progress > 0.9 ? 'DELIVERED' : 'OUT_FOR_DELIVERY',
            'position' => [
                'lat' => round($from['lat'] + ($to['lat'] - $from['lat']) * $progress, 6),
                'lng' => round($from['lng'] + ($to['lng'] - $from['lng']) * $progress, 6),
                'progress' => round($progress, 3),
            ],
            'destination' => $to,
            'eta_minutes' => max(3, (int) round((1 - $progress) * 40)),
            'rider' => ['name' => 'Sandbox rider', 'phone' => null],
            'sandbox' => true,
        ];
    }

    private function authHeaders(): array
    {
        return [
            'X-Client-Id' => $this->config['client_id'],
            'X-Client-Secret' => $this->config['client_secret'],
        ];
    }
}
