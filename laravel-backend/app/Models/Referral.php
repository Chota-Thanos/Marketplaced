<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'referrer_id', 'referee_id', 'code', 'status', 'referrer_reward', 'referee_reward', 'qualifying_order_id', 'rewarded_at'
    ];

    protected $casts = [
        'rewarded_at' => 'datetime',
    ];

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function referee()
    {
        return $this->belongsTo(User::class, 'referee_id');
    }

    public function qualifyingOrder()
    {
        return $this->belongsTo(Order::class, 'qualifying_order_id');
    }
}
