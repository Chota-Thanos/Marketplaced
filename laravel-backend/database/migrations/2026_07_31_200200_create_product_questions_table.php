<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id');
            $table->uuid('user_id')->nullable();
            $table->text('body');
            $table->string('status')->default('PENDING'); // PENDING, APPROVED, REJECTED
            $table->integer('helpful_count')->default(0);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['product_id', 'status']);
        });

        Schema::create('product_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('question_id');
            $table->uuid('user_id')->nullable();
            $table->text('body');
            // Answers come from staff or from customers who actually bought it.
            $table->boolean('is_official')->default(false);
            $table->boolean('is_verified_buyer')->default(false);
            $table->integer('helpful_count')->default(0);
            $table->timestamps();

            $table->foreign('question_id')->references('id')->on('product_questions')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_answers');
        Schema::dropIfExists('product_questions');
    }
};
