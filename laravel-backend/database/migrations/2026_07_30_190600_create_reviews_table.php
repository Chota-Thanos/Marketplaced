<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->uuid('user_id')->nullable();
            $table->uuid('order_id')->nullable(); // proof of purchase for the gate
            $table->integer('rating');
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->json('media')->nullable();
            $table->json('attribute_ratings')->nullable(); // {quality, value, packaging, delivery}
            $table->float('ai_fraud_score')->nullable();
            $table->string('status')->default('PENDING'); // PENDING, APPROVED, REJECTED
            $table->boolean('verified_purchase')->default(true);
            $table->integer('helpful_count')->default(0);
            $table->integer('not_helpful_count')->default(0);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
