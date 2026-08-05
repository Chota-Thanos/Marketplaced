<?php

namespace App\Services\Contracts;

use App\Models\Order;

/**
 * Payment provider contract (modelled on Razorpay's order/capture/refund flow).
 * Swap the binding in AppServiceProvider for a real driver once keys exist.
 */
interface PaymentGateway
{
    /** Create a provider-side payment intent for an amount in INR. */
    public function createIntent(float $amount, string $receipt, array $meta = []): array;

    /** Verify a client-reported payment. Returns [verified, payment_id, method]. */
    public function verify(string $intentId, ?string $paymentId, ?string $signature): array;

    /** Refund a captured payment back to source. */
    public function refund(Order $order, float $amount, string $reason): array;
}
