<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wishlists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('name')->default('My Wishlist');
            $table->string('share_token')->nullable()->unique(); // set when shared via link
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('wishlist_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('wishlist_id');
            $table->uuid('product_id');
            $table->uuid('variant_id')->nullable();
            // Price when added, so we can detect drops without a separate price history table.
            $table->decimal('price_at_add', 10, 2)->nullable();
            $table->timestamps();

            $table->foreign('wishlist_id')->references('id')->on('wishlists')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('variant_id')->references('id')->on('product_variants')->onDelete('set null');
            $table->unique(['wishlist_id', 'product_id', 'variant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wishlist_items');
        Schema::dropIfExists('wishlists');
    }
};
