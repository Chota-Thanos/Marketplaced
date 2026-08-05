<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number')->unique();
            $table->uuid('user_id');
            $table->string('status')->default('PENDING'); // PENDING, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
            $table->string('payment_status')->default('PENDING'); // PENDING, PAID, FAILED, REFUNDED
            $table->string('payment_method')->nullable(); // UPI, CARD, NETBANKING, COD
            $table->string('transaction_id')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('shipping_charge', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->json('shipping_address'); // snapshot at time of order
            $table->string('courier')->nullable();
            $table->string('tracking_no')->nullable();
            $table->boolean('label_generated')->default(false);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
