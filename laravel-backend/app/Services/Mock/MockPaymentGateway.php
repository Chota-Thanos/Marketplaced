<?php

namespace App\Services\Mock;

use App\Models\Order;
use App\Services\Contracts\PaymentGateway;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Sandbox payment driver. Always succeeds — it exists so the checkout and
 * refund flows can be exercised end-to-end without live Razorpay keys.
 * NOT a real gateway: it performs no capture, no signature verification,
 * and moves no money.
 */
class MockPaymentGateway implements PaymentGateway
{
    public function createIntent(float $amount, string $receipt, array $meta = []): array
    {
        $intent = [
            'id' => 'order_mock_'.Str::random(14),
            'amount' => (int) round($amount * 100), // paise, like Razorpay
            'currency' => 'INR',
            'receipt' => $receipt,
            'status' => 'created',
            'is_mock' => true,
        ];

        Log::info('[MockPaymentGateway] intent created', $intent + ['meta' => $meta]);

        return $intent;
    }

    public function verify(string $intentId, ?string $paymentId, ?string $signature): array
    {
        return [
            'verified' => true,
            'payment_id' => $paymentId ?: 'pay_mock_'.Str::random(14),
            'method' => 'UPI',
            'is_mock' => true,
        ];
    }

    public function refund(Order $order, float $amount, string $reason): array
    {
        $refund = [
            'id' => 'rfnd_mock_'.Str::random(14),
            'payment_id' => $order->transaction_id,
            'amount' => (int) round($amount * 100),
            'status' => 'processed',
            'reason' => $reason,
            'is_mock' => true,
        ];

        Log::info('[MockPaymentGateway] refund issued', $refund);

        return $refund;
    }
}
