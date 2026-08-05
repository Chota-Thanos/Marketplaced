<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductAnswer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'question_id', 'user_id', 'body', 'is_official', 'is_verified_buyer', 'helpful_count'
    ];

    protected $casts = [
        'is_official' => 'boolean',
        'is_verified_buyer' => 'boolean',
    ];

    public function question()
    {
        return $this->belongsTo(ProductQuestion::class, 'question_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
