<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'order_number', 'user_id', 'status', 'payment_status', 'payment_method', 'transaction_id',
    'subtotal', 'discount', 'shipping_charge', 'total_amount', 'shipping_address',
    'courier', 'carrier', 'service_level', 'delivery_fee_paise', 'promised_by',
    'tracking_no', 'label_generated',
    'coupon_id', 'coupon_code', 'wallet_applied',
    'cancellation_reason', 'cancelled_at', 'delivered_at',
    'points_earned', 'points_redeemed',
])]
class Order extends Model
{
    use HasFactory, HasUuids;

    public const STAGES = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

    protected function casts(): array
    {
        return [
            'shipping_address' => 'array',
            'label_generated' => 'boolean',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'shipping_charge' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'wallet_applied' => 'decimal:2',
            'cancelled_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    public function returnRequests()
    {
        return $this->hasMany(ReturnRequest::class);
    }

    /** Customers may only cancel before the order physically leaves the warehouse. */
    public function isCancellable(): bool
    {
        return in_array($this->status, ['PENDING', 'CONFIRMED', 'PACKED'], true);
    }

    public function isReturnable(int $windowDays = 7): bool
    {
        if ($this->status !== 'DELIVERED') {
            return false;
        }

        $deliveredAt = $this->delivered_at ?? $this->updated_at;

        return $deliveredAt->diffInDays(now()) <= $windowDays;
    }
}
