<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ledger for loyalty points — mirrors wallet_transactions so the
        // balance on users is always reconstructable from history.
        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('type'); // EARN, REDEEM, EXPIRE, ADJUST
            $table->integer('points');
            $table->integer('balance_after');
            $table->string('reason');
            $table->uuid('order_id')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
        });

        Schema::create('referrals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('referrer_id');
            $table->uuid('referee_id');
            $table->string('code');
            // Reward only pays out once the referee actually completes an order.
            $table->string('status')->default('PENDING'); // PENDING, REWARDED
            $table->decimal('referrer_reward', 10, 2)->default(0);
            $table->decimal('referee_reward', 10, 2)->default(0);
            $table->uuid('qualifying_order_id')->nullable();
            $table->timestamp('rewarded_at')->nullable();
            $table->timestamps();

            $table->foreign('referrer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('referee_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('qualifying_order_id')->references('id')->on('orders')->onDelete('set null');
            $table->unique('referee_id'); // a user can only be referred once
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->integer('points_earned')->default(0);
            $table->integer('points_redeemed')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['points_earned', 'points_redeemed']);
        });
        Schema::dropIfExists('referrals');
        Schema::dropIfExists('loyalty_transactions');
    }
};
