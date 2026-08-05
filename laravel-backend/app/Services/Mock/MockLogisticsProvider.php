<?php

namespace App\Services\Mock;

use App\Models\Order;
use App\Models\ReturnRequest;
use App\Services\Contracts\LogisticsProvider;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Sandbox courier driver. Generates plausible tracking numbers and a synthetic
 * scan history so shipment/tracking UI can be built and demoed without live
 * Shiprocket/Delhivery credentials. Nothing is actually shipped.
 */
class MockLogisticsProvider implements LogisticsProvider
{
    /** Metro pincodes get same-day; everything else standard. */
    private const EXPRESS_PINCODES = ['110001', '400001', '560001', '700001', '500001', '600001', '560103', '110016'];

    public function isServiceable(string $pincode): array
    {
        // Deliberately simple + deterministic: 6 digits not starting with 0.
        $serviceable = (bool) preg_match('/^[1-9][0-9]{5}$/', $pincode);
        $express = in_array($pincode, self::EXPRESS_PINCODES, true);

        return [
            'pincode' => $pincode,
            'serviceable' => $serviceable,
            'cod_available' => $serviceable,
            'express_available' => $express,
            'estimated_days' => $express ? 1 : ($serviceable ? 4 : null),
            'message' => $serviceable
                ? ($express ? 'Express delivery available — arrives tomorrow.' : 'Standard delivery in 3–5 business days.')
                : 'We do not currently deliver to this pincode.',
            'is_mock' => true,
        ];
    }

    public function createShipment(Order $order): array
    {
        $pincode = $order->shipping_address['pincode'] ?? '';
        $express = in_array($pincode, self::EXPRESS_PINCODES, true);

        $shipment = [
            'tracking_no' => 'SRK'.random_int(1000000, 9999999).'IN',
            'courier' => $express ? 'Delhivery Air Express' : 'Delhivery Surface',
            'label_url' => '/mock-labels/'.$order->order_number.'.pdf',
            'estimated_delivery' => now()->addDays($express ? 1 : 4)->toDateString(),
            'is_mock' => true,
        ];

        Log::info('[MockLogisticsProvider] shipment created', $shipment + ['order' => $order->order_number]);

        return $shipment;
    }

    public function track(string $trackingNo): array
    {
        // Synthetic but *deterministic* courier position: seeded from the
        // tracking number and advanced by elapsed minutes, so the marker moves
        // consistently between polls instead of jumping randomly.
        $seed = crc32($trackingNo);
        $progress = (($seed % 40) + (int) (now()->timestamp / 60) % 60) % 100 / 100;

        // Straight-line interpolation from the hub to the destination.
        $from = ['lat' => 12.9716, 'lng' => 77.5946]; // Bengaluru hub
        $to = ['lat' => 12.9352, 'lng' => 77.6245];   // delivery area

        $stopsAway = max(0, (int) round((1 - $progress) * 6));

        return [
            'tracking_no' => $trackingNo,
            'current_status' => 'IN_TRANSIT',
            'scans' => [
                ['status' => 'Picked Up', 'location' => 'Bengaluru Hub', 'at' => now()->subDays(2)->toIso8601String()],
                ['status' => 'In Transit', 'location' => 'Nagpur Sorting Center', 'at' => now()->subDay()->toIso8601String()],
                ['status' => 'Out for Delivery', 'location' => 'Destination Hub', 'at' => now()->toIso8601String()],
            ],
            'position' => [
                'lat' => round($from['lat'] + ($to['lat'] - $from['lat']) * $progress, 6),
                'lng' => round($from['lng'] + ($to['lng'] - $from['lng']) * $progress, 6),
                'progress' => round($progress, 3),
            ],
            'destination' => $to,
            'stops_away' => $stopsAway,
            'eta_minutes' => max(5, $stopsAway * 7),
            'is_mock' => true,
        ];
    }

    public function schedulePickup(ReturnRequest $return): array
    {
        $pickup = [
            'pickup_tracking_no' => 'RTN'.random_int(1000000, 9999999).'IN',
            'scheduled_for' => now()->addDays(2)->toDateString(),
            'courier' => 'Delhivery Reverse Logistics',
            'is_mock' => true,
        ];

        Log::info('[MockLogisticsProvider] return pickup scheduled', $pickup + ['rma' => $return->rma_number]);

        return $pickup;
    }
}
