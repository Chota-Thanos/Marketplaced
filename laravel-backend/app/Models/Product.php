<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'title', 'slug', 'description', 'category_id', 'brand', 'mrp', 'price',
    'images', 'status', 'is_new', 'tags', 'features', 'meta_title', 'meta_description',
    'rollover_image', 'authenticity_grade', 'local_store_available',
    'local_store_name', 'express_pincodes', 'hotspots',
    'spin_images', 'cod_available',
    // Shipping envelope. Drives carrier selection and what we get billed.
    'weight_grams', 'length_cm', 'width_cm', 'height_cm', 'requires_vehicle',
    // Optional Shoppertainment clip. A product is complete without either.
    'reel_video_url', 'reel_caption',
])]
class Product extends Model
{
    use HasFactory, HasUuids;

    protected $appends = ['discount', 'stock_count', 'in_stock', 'rating', 'reviews_count', 'has_reel'];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'tags' => 'array',
            'features' => 'array',
            'is_new' => 'boolean',
            'mrp' => 'decimal:2',
            'price' => 'decimal:2',
            'local_store_available' => 'boolean',
            'express_pincodes' => 'array',
            'hotspots' => 'array',
            'spin_images' => 'array',
            'cod_available' => 'boolean',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function variants()
    {
        // Ordered by id, not created_at: variants created in one transaction
        // share a timestamp, and UUIDv7 ids are time-sortable, so this is the
        // only stable way to keep the selector in its authored order.
        return $this->hasMany(ProductVariant::class)->orderBy('id');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews()
    {
        return $this->reviews()->where('status', 'APPROVED');
    }

    /** Real aggregate rating computed from approved reviews — never randomised. */
    public function getRatingAttribute(): float
    {
        return round((float) $this->approvedReviews()->avg('rating'), 1) ?: 0.0;
    }

    public function getReviewsCountAttribute(): int
    {
        return $this->approvedReviews()->count();
    }

    public function getStockCountAttribute(): int
    {
        return (int) $this->variants()->sum('stock');
    }

    public function getInStockAttribute(): bool
    {
        return $this->stock_count > 0;
    }

    /** Whether this product opted into the Reels feed. Most will not. */
    public function getHasReelAttribute(): bool
    {
        return filled($this->reel_video_url);
    }

    public function getDiscountAttribute(): int
    {
        if ((float) $this->mrp <= 0) {
            return 0;
        }

        return (int) round((($this->mrp - $this->price) / $this->mrp) * 100);
    }
}
