<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['product_id', 'sku', 'color', 'size', 'mrp', 'price', 'cost_price', 'stock', 'images'])]
class ProductVariant extends Model
{
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'mrp' => 'decimal:2',
            'price' => 'decimal:2',
            'cost_price' => 'decimal:2',
        ];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'variant_id');
    }

    /** Falls back to the parent product's price when the variant has no override. */
    public function getEffectivePriceAttribute(): float
    {
        return (float) ($this->price ?? $this->product->price);
    }

    public function getEffectiveMrpAttribute(): float
    {
        return (float) ($this->mrp ?? $this->product->mrp);
    }
}
