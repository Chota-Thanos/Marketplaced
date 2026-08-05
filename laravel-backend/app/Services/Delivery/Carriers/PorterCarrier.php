<?php

namespace App\Services\Delivery\Carriers;

use App\Models\Order;
use App\Services\Delivery\DeliveryQuote;
use App\Services\Delivery\ServiceLevel;
use App\Services\Delivery\Shipment;

/**
 * Porter — trucks and tempos. The heavy-goods path.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOT LIVE. Porter runs a partner API programme (their gateway host is the
 * `pfe-apigw` one this defaults to) but it is not self-serve: you need a
 * business account and an issued API key, and the UAT host only answers to
 * onboarded partners.
 *
 * This is the carrier that makes the whole multi-carrier design worth building.
 * A 40kg washing machine cannot go on a rider network at any price, and handing
 * it to a parcel aggregator gets it rejected at pickup. Porter is the only
 * option in the registry whose envelope reaches 750kg, so the allocator routes
 * anything heavy here by construction rather than by a hardcoded if-statement
 * somewhere in the checkout controller.
 *
 * Vehicle selection is ours, not Porter's: we pick the smallest vehicle that
 * fits, because quoting a Tata Ace for a 25kg parcel is money thrown away.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class PorterCarrier extends BaseCarrier
{
    /** Smallest-first. The allocator wants the cheapest vehicle that fits. */
    private const VEHICLES = [
        ['code' => '2-wheeler',   'label' => '2 Wheeler',   'max_grams' => 20000],
        ['code' => '3-wheeler',   'label' => '3 Wheeler',   'max_grams' => 500000],
        ['code' => 'tata-ace',    'label' => 'Tata Ace',    'max_grams' => 750000],
    ];

    public function key(): string
    {
        return 'porter';
    }

    public function supportedServiceLevels(): array
    {
        return [ServiceLevel::INSTANT, ServiceLevel::SAME_DAY, ServiceLevel::HEAVY];
    }

    public function isConfigured(): bool
    {
        return filled($this->config['api_key'] ?? null);
    }

    /** The cheapest vehicle that can physically take the load. */
    private function vehicleFor(Shipment $shipment): ?array
    {
        foreach (self::VEHICLES as $vehicle) {
            if ($shipment->billableGrams() <= $vehicle['max_grams']) {
                return $vehicle;
            }
        }

        return null;
    }

    public function quote(Shipment $shipment): array
    {
        $vehicle = $this->vehicleFor($shipment);
        if (! $vehicle) {
            return [];
        }

        // Anything past a two-wheeler is a scheduled job, not a 45-minute one.
        $level = $shipment->billableGrams() > 20000 ? ServiceLevel::HEAVY : ServiceLevel::INSTANT;

        if (! $this->isConfigured()) {
            return [$this->sandboxQuote($shipment, $level, 'Porter — '.$vehicle['label'])];
        }

        try {
            $response = $this->http($this->authHeaders())->post($this->baseUrl().'/v1/get_quote', [
                'pickup_details' => ['lat' => config('delivery.pickup_address.lat'), 'lng' => config('delivery.pickup_address.lng')],
                'drop_details' => ['pincode' => $shipment->dropPincode],
                'customer' => ['name' => 'BazaarX', 'mobile' => ['country_code' => '+91', 'number' => config('delivery.pickup_address.phone')]],
            ]);

            return $response->successful()
                ? $this->mapQuoteResponse($response->json(), $shipment, $level)
                : [];
        } catch (\Throwable $e) {
            $this->logFailure('quote', $e, ['shipment' => $shipment->toArray()]);

            return [];
        }
    }

    /** CONFIRM AGAINST THE PARTNER SPEC. */
    protected function mapQuoteResponse(array $body, Shipment $shipment, string $level): array
    {
        $quotes = [];
        $needed = $shipment->billableGrams();

        foreach ($body['vehicles'] ?? [] as $vehicle) {
            $type = $vehicle['type'] ?? '';
            $known = collect(self::VEHICLES)->firstWhere('code', $type);

            // Skip vehicles too small for the load — Porter returns the full
            // fleet and it is on us not to book a bike for a wardrobe.
            if ($known && $needed > $known['max_grams']) {
                continue;
            }

            $quotes[] = new DeliveryQuote(
                carrier: $this->key(),
                carrierLabel: 'Porter — '.($known['label'] ?? $type),
                serviceLevel: $level,
                pricePaise: (int) ($vehicle['fare']['minor_amount'] ?? 0),
                etaMinutes: (int) ($vehicle['eta']['minutes'] ?? 120),
                codSupported: true,
                serviceCode: $type,
                raw: $vehicle,
            );
        }

        // Cheapest fitting vehicle only — the customer is choosing a delivery,
        // not a truck.
        usort($quotes, fn ($a, $b) => $a->pricePaise <=> $b->pricePaise);

        return $quotes ? [$quotes[0]] : [];
    }

    public function book(Order $order, string $serviceLevel): array
    {
        if (! $this->isConfigured()) {
            return $this->sandboxBooking($order, $serviceLevel);
        }

        $response = $this->http($this->authHeaders())
            ->post($this->baseUrl().'/v1/orders/create', $this->bookingPayload($order));

        if ($response->failed()) {
            throw new \RuntimeException('Porter rejected the booking: '.$response->body());
        }

        $body = $response->json();

        return [
            'carrier' => $this->key(),
            'courier' => 'Porter',
            'service_level' => $serviceLevel,
            'tracking_no' => $body['order_id'] ?? null,
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
            'request_id' => $order->order_number,
            'pickup_details' => [
                'address' => [
                    'street_address1' => $pickup['line1'],
                    'city' => $pickup['city'],
                    'state' => $pickup['state'],
                    'pincode' => $pickup['pincode'],
                    'country' => 'India',
                    'lat' => $pickup['lat'],
                    'lng' => $pickup['lng'],
                    'contact_details' => ['name' => $pickup['name'], 'phone_number' => '+91'.$pickup['phone']],
                ],
            ],
            'drop_details' => [
                'address' => [
                    'street_address1' => $drop['line1'] ?? '',
                    'street_address2' => $drop['line2'] ?? '',
                    'city' => $drop['city'] ?? '',
                    'state' => $drop['state'] ?? '',
                    'pincode' => $drop['pincode'] ?? '',
                    'country' => 'India',
                    'contact_details' => [
                        'name' => $drop['name'] ?? '',
                        'phone_number' => '+91'.($drop['phone'] ?? ''),
                    ],
                ],
            ],
        ];
    }

    public function track(string $trackingNo): array
    {
        if (! $this->isConfigured()) {
            return [
                'tracking_no' => $trackingNo,
                'carrier' => $this->key(),
                'current_status' => 'IN_TRANSIT',
                'eta_minutes' => 95,
                'sandbox' => true,
            ];
        }

        $response = $this->http($this->authHeaders())->get($this->baseUrl().'/v1/orders/'.$trackingNo);
        $body = $response->successful() ? $response->json() : [];

        return [
            'tracking_no' => $trackingNo,
            'carrier' => $this->key(),
            'current_status' => $body['status'] ?? 'IN_TRANSIT',
            'position' => [
                'lat' => $body['partner_info']['location']['lat'] ?? null,
                'lng' => $body['partner_info']['location']['long'] ?? null,
            ],
            'rider' => [
                'name' => $body['partner_info']['name'] ?? null,
                'phone' => $body['partner_info']['mobile']['number'] ?? null,
                'vehicle' => $body['partner_info']['vehicle_number'] ?? null,
            ],
            'sandbox' => false,
        ];
    }

    public function cancel(string $trackingNo): array
    {
        if (! $this->isConfigured()) {
            return parent::cancel($trackingNo);
        }

        $response = $this->http($this->authHeaders())
            ->post($this->baseUrl().'/v1/orders/'.$trackingNo.'/cancel');

        return ['cancelled' => $response->successful(), 'tracking_no' => $trackingNo, 'sandbox' => false];
    }

    private function authHeaders(): array
    {
        return ['X-API-KEY' => $this->config['api_key']];
    }
}
