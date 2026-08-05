<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_queries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('query');
            $table->string('normalised_query')->index(); // lowercased/trimmed, for grouping
            $table->integer('result_count')->default(0);
            $table->uuid('user_id')->nullable();
            $table->boolean('was_intent_search')->default(false);
            $table->json('parsed_intent')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['result_count', 'created_at']); // zero-result reporting
        });

        // Lightweight view tracking — powers "Trending Now" and personalised picks.
        Schema::create('product_views', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->uuid('user_id')->nullable();
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['product_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_views');
        Schema::dropIfExists('search_queries');
    }
};
