<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'rma_number', 'order_id', 'order_item_id', 'user_id', 'kind', 'reason',
    'comments', 'media', 'quantity', 'status', 'refund_mode', 'refund_amount',
    'refund_status', 'exchange_variant_id', 'pickup_tracking_no', 'admin_note',
    'resolved_at',
])]
class ReturnRequest extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'media' => 'array',
            'refund_amount' => 'decimal:2',
            'resolved_at' => 'datetime',
        ];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function exchangeVariant()
    {
        return $this->belongsTo(ProductVariant::class, 'exchange_variant_id');
    }
}
