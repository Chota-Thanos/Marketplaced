<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('return_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('rma_number')->unique();
            $table->uuid('order_id');
            $table->uuid('order_item_id');
            $table->uuid('user_id');
            $table->string('kind')->default('RETURN'); // RETURN, EXCHANGE
            $table->string('reason');
            $table->text('comments')->nullable();
            $table->json('media')->nullable();
            $table->integer('quantity')->default(1);
            // REQUESTED -> APPROVED -> PICKUP_SCHEDULED -> PICKED_UP -> REFUNDED / REJECTED
            $table->string('status')->default('REQUESTED');
            $table->string('refund_mode')->nullable(); // SOURCE, WALLET
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->string('refund_status')->default('PENDING'); // PENDING, PROCESSING, COMPLETED
            $table->uuid('exchange_variant_id')->nullable(); // for EXCHANGE
            $table->string('pickup_tracking_no')->nullable();
            $table->text('admin_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('order_item_id')->references('id')->on('order_items')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('exchange_variant_id')->references('id')->on('product_variants')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_requests');
    }
};
