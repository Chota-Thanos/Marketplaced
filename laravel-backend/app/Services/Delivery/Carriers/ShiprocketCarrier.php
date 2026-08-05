<?php

namespace App\Services\Delivery\Carriers;

use App\Models\Order;
use App\Models\ReturnRequest;
use App\Services\Delivery\DeliveryQuote;
use App\Services\Delivery\ServiceLevel;
use App\Services\Delivery\Shipment;
use Illuminate\Support\Facades\Cache;

/**
 * Shiprocket — parcel aggregator. The workhorse for anything crossing a city.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Of the five carriers here this is the one you can actually get credentials
 * for without a commercial negotiation: sign up, create an API user, and the
 * `/v1/external` endpoints below become live. The endpoint paths and the
 * token-exchange flow are from their public integration docs.
 *
 * Still verify the courier-serviceability response mapping against a live call
 * before go-live — the aggregator returns a long courier list whose shape has
 * changed across versions.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class ShiprocketCarrier extends BaseCarrier
{
    public function key(): string
    {
        return 'shiprocket';
    }

    public function supportedServiceLevels(): array
    {
        return [ServiceLevel::EXPRESS, ServiceLevel::STANDARD];
    }

    public function isConfigured(): bool
    {
        return filled($this->config['email'] ?? null) && filled($this->config['password'] ?? null);
    }

    /**
     * Shiprocket issues a bearer token valid for 10 days. Cached for 9 so we
     * are not re-authenticating on every quote — their auth endpoint is rate
     * limited far more aggressively than the rate endpoint.
     */
    private function token(): ?string
    {
        return Cache::remember('shiprocket.token', now()->addDays(9), function () {
            $response = $this->http()->post($this->baseUrl().'/auth/login', [
                'email' => $this->config['email'],
                'password' => $this->config['password'],
            ]);

            return $response->successful() ? ($response->json()['token'] ?? null) : null;
        });
    }

    private function authHeaders(): array
    {
        return ['Authorization' => 'Bearer '.$this->token()];
    }

    public function quote(Shipment $shipment): array
    {
        if (! $this->isConfigured()) {
            return [
                $this->sandboxQuote($shipment, ServiceLevel::STANDARD, 'Shiprocket — Surface'),
                $this->sandboxQuote($shipment, ServiceLevel::EXPRESS, 'Shiprocket — Air'),
            ];
        }

        try {
            $response = $this->http($this->authHeaders())
                ->get($this->baseUrl().'/courier/serviceability/', [
                    'pickup_postcode' => $shipment->pickupPincode,
                    'delivery_postcode' => $shipment->dropPincode,
                    'cod' => $shipment->cod ? 1 : 0,
                    'weight' => round($shipment->billableGrams() / 1000, 2),
                ]);

            return $response->successful() ? $this->mapQuoteResponse($response->json()) : [];
        } catch (\Throwable $e) {
            $this->logFailure('quote', $e, ['shipment' => $shipment->toArray()]);

            return [];
        }
    }

    protected function mapQuoteResponse(array $body): array
    {
        $couriers = $body['data']['available_courier_companies'] ?? [];
        $quotes = [];

        foreach ($couriers as $courier) {
            $days = (int) ($courier['estimated_delivery_days'] ?? 4);

            $quotes[] = new DeliveryQuote(
                carrier: $this->key(),
                carrierLabel: 'Shiprocket — '.($courier['courier_name'] ?? 'Surface'),
                // Their own "is this air" flag is unreliable across couriers, so
                // classify on the promise instead: 1 day is express, else standard.
                serviceLevel: $days <= 1 ? ServiceLevel::EXPRESS : ServiceLevel::STANDARD,
                pricePaise: (int) round(((float) ($courier['rate'] ?? 0)) * 100),
                etaMinutes: max(1, $days) * 24 * 60,
                codSupported: (int) ($courier['cod'] ?? 0) === 1,
                serviceCode: (string) ($courier['courier_company_id'] ?? ''),
                raw: $courier,
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
            ->post($this->baseUrl().'/orders/create/adhoc', $this->bookingPayload($order));

        if ($response->failed()) {
            throw new \RuntimeException('Shiprocket rejected the booking: '.$response->body());
        }

        $body = $response->json();

        return [
            'carrier' => $this->key(),
            'courier' => $body['courier_name'] ?? 'Shiprocket',
            'service_level' => $serviceLevel,
            'tracking_no' => $body['awb_code'] ?? $body['shipment_id'] ?? null,
            'label_url' => $body['label_url'] ?? null,
            'sandbox' => false,
        ];
    }

    protected function bookingPayload(Order $order): array
    {
        $drop = $order->shipping_address;

        return [
            'order_id' => $order->order_number,
            'order_date' => $order->created_at->toDateString(),
            'pickup_location' => $this->config['pickup_location'],
            'billing_customer_name' => $drop['name'] ?? '',
            'billing_address' => $drop['line1'] ?? '',
            'billing_address_2' => $drop['line2'] ?? '',
            'billing_city' => $drop['city'] ?? '',
            'billing_pincode' => $drop['pincode'] ?? '',
            'billing_state' => $drop['state'] ?? '',
            'billing_country' => 'India',
            'billing_email' => $order->user->email ?? '',
            'billing_phone' => $drop['phone'] ?? '',
            'shipping_is_billing' => true,
            'order_items' => $order->items->map(fn ($item) => [
                'name' => $item->product->title ?? 'Item',
                'sku' => $item->product->slug ?? $item->product_id,
                'units' => $item->quantity,
                'selling_price' => (float) $item->price,
            ])->all(),
            'payment_method' => $order->payment_method === 'COD' ? 'COD' : 'Prepaid',
            'sub_total' => (float) $order->total_amount,
            // Shiprocket wants cm/kg. Sent as the parcel envelope rather than
            // per-item because it books one shipment, not one per line.
            'length' => 25,
            'breadth' => 20,
            'height' => 12,
            'weight' => round(
                $order->items->sum(fn ($i) => ($i->product->weight_grams ?? 500) * $i->quantity) / 1000,
                2,
            ),
        ];
    }

    public function track(string $trackingNo): array
    {
        if (! $this->isConfigured()) {
            return [
                'tracking_no' => $trackingNo,
                'carrier' => $this->key(),
                'current_status' => 'IN_TRANSIT',
                'scans' => [
                    ['status' => 'Picked Up', 'location' => 'Bengaluru Hub', 'at' => now()->subDays(2)->toIso8601String()],
                    ['status' => 'In Transit', 'location' => 'Sorting Centre', 'at' => now()->subDay()->toIso8601String()],
                ],
                'sandbox' => true,
            ];
        }

        $response = $this->http($this->authHeaders())
            ->get($this->baseUrl().'/courier/track/awb/'.$trackingNo);

        $data = $response->successful() ? ($response->json()['tracking_data'] ?? []) : [];

        return [
            'tracking_no' => $trackingNo,
            'carrier' => $this->key(),
            'current_status' => $data['shipment_track'][0]['current_status'] ?? 'IN_TRANSIT',
            'scans' => collect($data['shipment_track_activities'] ?? [])->map(fn ($s) => [
                'status' => $s['activity'] ?? '',
                'location' => $s['location'] ?? '',
                'at' => $s['date'] ?? '',
            ])->all(),
            'sandbox' => false,
        ];
    }

    public function schedulePickup(ReturnRequest $return): array
    {
        if (! $this->isConfigured()) {
            return parent::schedulePickup($return);
        }

        $response = $this->http($this->authHeaders())
            ->post($this->baseUrl().'/orders/create/return', [
                'order_id' => $return->rma_number,
                'order_date' => now()->toDateString(),
            ]);

        $body = $response->successful() ? $response->json() : [];

        return [
            'carrier' => $this->key(),
            'pickup_tracking_no' => $body['awb_code'] ?? null,
            'scheduled_for' => now()->addDays(2)->toDateString(),
            'sandbox' => false,
        ];
    }
}
