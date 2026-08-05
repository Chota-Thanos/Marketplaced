<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Single entry point for customer notifications.
 *
 * In-app notifications are real (persisted, drive the bell UI). Email/SMS are
 * currently written to the log instead of being sent — swap the two `dispatch*`
 * methods for Mailable/SMS-gateway calls once credentials exist.
 */
class NotificationService
{
    public function send(User $user, string $type, string $title, ?string $body = null, array $data = []): ?AppNotification
    {
        if (! $user->wantsNotification($type)) {
            return null;
        }

        $notification = AppNotification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        $this->dispatchEmail($user, $title, $body);
        $this->dispatchSms($user, $title);

        return $notification;
    }

    public function orderPlaced($order): void
    {
        $this->send(
            $order->user,
            'ORDER_UPDATE',
            "Order {$order->order_number} confirmed",
            'Thanks for your order! We will notify you when it ships.',
            ['order_id' => $order->id, 'order_number' => $order->order_number],
        );
    }

    public function orderStatusChanged($order, string $status): void
    {
        $labels = [
            'PACKED' => 'has been packed',
            'SHIPPED' => 'has shipped',
            'OUT_FOR_DELIVERY' => 'is out for delivery',
            'DELIVERED' => 'has been delivered',
            'CANCELLED' => 'was cancelled',
        ];

        if (! isset($labels[$status])) {
            return;
        }

        $this->send(
            $order->user,
            'ORDER_UPDATE',
            "Order {$order->order_number} {$labels[$status]}",
            $status === 'DELIVERED' ? 'Enjoy! You can now leave a verified review.' : null,
            ['order_id' => $order->id, 'order_number' => $order->order_number, 'status' => $status],
        );
    }

    public function refundUpdate($return, string $message): void
    {
        $this->send(
            $return->user,
            'REFUND',
            "Return {$return->rma_number}: {$message}",
            null,
            ['return_id' => $return->id, 'rma_number' => $return->rma_number, 'status' => $return->status],
        );
    }

    private function dispatchEmail(User $user, string $subject, ?string $body): void
    {
        if (! $user->email) {
            return;
        }

        Log::info('[NotificationService][MOCK EMAIL]', [
            'to' => $user->email,
            'subject' => $subject,
            'body' => $body,
        ]);
    }

    /**
     * Send to a bare phone number with no User behind it.
     *
     * Login OTP is the case this exists for: the number belongs to someone who
     * may not have an account yet, so there is nothing to check preferences
     * against and nothing to persist an in-app notification to.
     */
    public function sendSmsToPhone(string $phone, string $message): void
    {
        if ($phone === '') {
            return;
        }

        Log::info('[NotificationService][MOCK SMS]', [
            'to' => $phone,
            'message' => $message,
        ]);
    }

    private function dispatchSms(User $user, string $message): void
    {
        if (! $user->phone) {
            return;
        }

        $this->sendSmsToPhone($user->phone, $message);
    }
}
