<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['wishlist_id', 'product_id', 'variant_id', 'price_at_add'])]
class WishlistItem extends Model
{
    use HasFactory, HasUuids;

    protected $appends = ['price_dropped', 'back_in_stock'];

    protected function casts(): array
    {
        return ['price_at_add' => 'decimal:2'];
    }

    public function wishlist()
    {
        return $this->belongsTo(Wishlist::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function getPriceDroppedAttribute(): bool
    {
        if (! $this->price_at_add || ! $this->relationLoaded('product') || ! $this->product) {
            return false;
        }

        return (float) $this->product->price < (float) $this->price_at_add;
    }

    public function getBackInStockAttribute(): bool
    {
        if (! $this->relationLoaded('product') || ! $this->product) {
            return false;
        }

        return $this->product->stock_count > 0;
    }
}
