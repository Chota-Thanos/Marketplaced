<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->string('sku')->nullable()->unique();
            $table->string('color')->nullable();
            $table->string('size')->nullable();
            $table->decimal('mrp', 10, 2)->nullable(); // falls back to product mrp when null
            $table->decimal('price', 10, 2)->nullable(); // falls back to product price when null
            $table->decimal('cost_price', 10, 2)->nullable();
            $table->integer('stock')->default(0);
            $table->json('images')->nullable(); // falls back to product images when null
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
