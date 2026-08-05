<?php

namespace App\Services\Delivery\Carriers;

use App\Models\Order;
use App\Services\Delivery\DeliveryQuote;
use App\Services\Delivery\ServiceLevel;
use App\Services\Delivery\Shipment;

/**
 * Delhivery — direct carrier contract.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOT LIVE without a token. Delhivery issues an API token to contracted
 * shippers; the endpoints below are from their public integration docs, but
 * their rate card is negotiated per account, so the quote mapping is written
 * against the standard invoice-charges response and should be checked against
 * whatever your contract returns.
 *
 * Kept alongside Shiprocket rather than instead of it because the economics
 * flip with volume: an aggregator is cheaper until you ship enough to sign
 * directly, and then it is not. Having both in the registry means that switch
 * is a config change and the allocator picks whichever is cheaper per shipment
 * in the meantime.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class DelhiveryCarrier extends BaseCarrier
{
    public function key(): string
    {
        return 'delhivery';
    }

    public function supportedServiceLevels(): array
    {
        return [ServiceLevel::EXPRESS, ServiceLevel::STANDARD];
    }

    public function isConfigured(): bool
    {
        return filled($this->config['api_token'] ?? null);
    }

    private function authHeaders(): array
    {
        return ['Authorization' => 'Token '.$this->config['api_token']];
    }

    public function quote(Shipment $shipment): array
    {
        if (! $this->isConfigured()) {
            return [$this->sandboxQuote($shipment, ServiceLevel::STANDARD, 'Delhivery — Surface')];
        }

        try {
            $response = $this->http($this->authHeaders())
                ->get($this->baseUrl().'/api/kinko/v1/invoice/charges/.json', [
                    'md' => 'S', // surface
                    'ss' => 'Delivered',
                    'd_pin' => $shipment->dropPincode,
                    'o_pin' => $shipment->pickupPincode,
                    'cgm' => $shipment->billableGrams(),
                    'pt' => $shipment->cod ? 'COD' : 'Pre-paid',
                ]);

            return $response->successful() ? $this->mapQuoteResponse($response->json(), $shipment) : [];
        } catch (\Throwable $e) {
            $this->logFailure('quote', $e, ['shipment' => $shipment->toArray()]);

            return [];
        }
    }

    protected function mapQuoteResponse(array $body, Shipment $shipment): array
    {
        // The charges endpoint returns a list with one entry per matching slab.
        $first = $body[0] ?? null;
        if (! $first) {
            return [];
        }

        $total = (float) ($first['total_amount'] ?? 0);
        if ($total <= 0) {
            return [];
        }

        return [
            new DeliveryQuote(
                carrier: $this->key(),
                carrierLabel: 'Delhivery — Surface',
                serviceLevel: ServiceLevel::STANDARD,
                pricePaise: (int) round($total * 100),
                etaMinutes: ($shipment->isIntracity() ? 2 : 4) * 24 * 60,
                codSupported: true,
                raw: $first,
            ),
        ];
    }

    public function book(Order $order, string $serviceLevel): array
    {
        if (! $this->isConfigured()) {
            return $this->sandboxBooking($order, $serviceLevel);
        }

        // Delhivery's manifest endpoint takes a form-encoded `data=` payload
        // rather than a JSON body — a genuine quirk, not a mistake here.
        $response = $this->http($this->authHeaders() + [
            'Content-Type' => 'application/x-www-form-urlencoded',
        ])->asForm()->post($this->baseUrl().'/api/cmu/create.json', [
            'format' => 'json',
            'data' => json_encode($this->bookingPayload($order)),
        ]);

        if ($response->failed()) {
            throw new \RuntimeException('Delhivery rejected the manifest: '.$response->body());
        }

        $body = $response->json();
        $package = $body['packages'][0] ?? [];

        return [
            'carrier' => $this->key(),
            'courier' => 'Delhivery',
            'service_level' => $serviceLevel,
            'tracking_no' => $package['waybill'] ?? null,
            'label_url' => null,
            'sandbox' => false,
        ];
    }

    protected function bookingPayload(Order $order): array
    {
        $drop = $order->shipping_address;

        return [
            'shipments' => [[
                'name' => $drop['name'] ?? '',
                'add' => trim(($drop['line1'] ?? '').' '.($drop['line2'] ?? '')),
                'pin' => $drop['pincode'] ?? '',
                'city' => $drop['city'] ?? '',
                'state' => $drop['state'] ?? '',
                'country' => 'India',
                'phone' => $drop['phone'] ?? '',
                'order' => $order->order_number,
                'payment_mode' => $order->payment_method === 'COD' ? 'COD' : 'Prepaid',
                'cod_amount' => $order->payment_method === 'COD' ? (float) $order->total_amount : 0,
                'total_amount' => (float) $order->total_amount,
                'weight' => $order->items->sum(fn ($i) => ($i->product->weight_grams ?? 500) * $i->quantity),
            ]],
            'pickup_location' => ['name' => $this->config['client_name']],
        ];
    }

    public function track(string $trackingNo): array
    {
        if (! $this->isConfigured()) {
            return [
                'tracking_no' => $trackingNo,
                'carrier' => $this->key(),
                'current_status' => 'IN_TRANSIT',
                'sandbox' => true,
            ];
        }

        $response = $this->http($this->authHeaders())
            ->get($this->baseUrl().'/api/v1/packages/json/', ['waybill' => $trackingNo]);

        $shipment = $response->successful() ? ($response->json()['ShipmentData'][0]['Shipment'] ?? []) : [];

        return [
            'tracking_no' => $trackingNo,
            'carrier' => $this->key(),
            'current_status' => $shipment['Status']['Status'] ?? 'IN_TRANSIT',
            'scans' => collect($shipment['Scans'] ?? [])->map(fn ($s) => [
                'status' => $s['ScanDetail']['Scan'] ?? '',
                'location' => $s['ScanDetail']['ScannedLocation'] ?? '',
                'at' => $s['ScanDetail']['StatusDateTime'] ?? '',
            ])->all(),
            'sandbox' => false,
        ];
    }
}
