<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One vote per user per review — the unique index is what actually
        // prevents a user inflating a review's helpful count by re-voting.
        Schema::create('review_votes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('review_id');
            $table->uuid('user_id');
            $table->boolean('is_helpful');
            $table->timestamps();

            $table->foreign('review_id')->references('id')->on('reviews')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['review_id', 'user_id']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->text('admin_reply')->nullable();
            $table->timestamp('admin_replied_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['admin_reply', 'admin_replied_at']);
        });
        Schema::dropIfExists('review_votes');
    }
};
