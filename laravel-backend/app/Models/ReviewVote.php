<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['review_id', 'user_id', 'is_helpful'])]
class ReviewVote extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return ['is_helpful' => 'boolean'];
    }

    public function review()
    {
        return $this->belongsTo(Review::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
