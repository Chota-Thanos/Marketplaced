<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('coupon_id')->nullable();
            $table->string('coupon_code')->nullable();
            $table->decimal('wallet_applied', 10, 2)->default(0);
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->foreign('coupon_id')->references('id')->on('coupons')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['coupon_id']);
            $table->dropColumn([
                'coupon_id', 'coupon_code', 'wallet_applied',
                'cancellation_reason', 'cancelled_at', 'delivered_at',
            ]);
        });
    }
};
