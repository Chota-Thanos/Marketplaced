<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->uuid('category_id');
            $table->string('brand')->nullable();
            $table->decimal('mrp', 10, 2);
            $table->decimal('price', 10, 2);
            $table->json('images')->nullable();
            $table->string('status')->default('ACTIVE'); // DRAFT, ACTIVE, OUT_OF_STOCK, DISCONTINUED
            $table->boolean('is_new')->default(false);
            $table->json('tags')->nullable();
            $table->string('meta_title')->nullable();
            $table->string('meta_description')->nullable();
            // Storefront presentation fields carried over from the old mock catalog
            $table->string('rollover_image')->nullable();
            $table->string('authenticity_grade')->nullable();
            $table->boolean('local_store_available')->default(false);
            $table->string('local_store_name')->nullable();
            $table->json('express_pincodes')->nullable();
            $table->json('hotspots')->nullable();
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('categories');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
