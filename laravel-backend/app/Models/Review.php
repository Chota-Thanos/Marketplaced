<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'product_id', 'user_id', 'order_id', 'rating', 'title', 'body', 'media',
    'attribute_ratings', 'ai_fraud_score', 'status', 'verified_purchase',
    'admin_reply', 'admin_replied_at',
])]
class Review extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'media' => 'array',
            'attribute_ratings' => 'array',
            'verified_purchase' => 'boolean',
            'admin_replied_at' => 'datetime',
        ];
    }

    public function votes()
    {
        return $this->hasMany(ReviewVote::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
