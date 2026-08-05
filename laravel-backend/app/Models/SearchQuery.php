<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchQuery extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'query', 'normalised_query', 'result_count', 'user_id', 'was_intent_search', 'parsed_intent'
    ];

    protected $casts = [
        'was_intent_search' => 'boolean',
        'parsed_intent' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
