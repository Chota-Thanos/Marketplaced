<?php

namespace App\Services\Contracts;

use App\Models\Order;
use App\Models\ReturnRequest;

/**
 * Courier/3PL contract (modelled on Shiprocket/Delhivery).
 * Swap the binding in AppServiceProvider for a real driver once keys exist.
 */
interface LogisticsProvider
{
    public function isServiceable(string $pincode): array;

    public function createShipment(Order $order): array;

    public function track(string $trackingNo): array;

    public function schedulePickup(ReturnRequest $return): array;
}
