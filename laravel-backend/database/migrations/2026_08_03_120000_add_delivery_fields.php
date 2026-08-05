<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gives the allocator real inputs and records what it decided.
 *
 * Without weight and dimensions on products, every shipment quotes at a default
 * and the carrier bills the difference back after delivery — the single most
 * common way an Indian D2C operation loses margin quietly.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Grams and centimetres, integers. Carriers bill in these units and
            // storing floats invites rounding drift between quote and manifest.
            $table->unsignedInteger('weight_grams')->nullable()->after('stock_count');
            $table->unsignedSmallInteger('length_cm')->nullable()->after('weight_grams');
            $table->unsignedSmallInteger('width_cm')->nullable()->after('length_cm');
            $table->unsignedSmallInteger('height_cm')->nullable()->after('width_cm');

            // Some items can never go on a bike regardless of weight — a 2m
            // curtain rod is light and still needs a vehicle.
            $table->boolean('requires_vehicle')->default(false)->after('height_cm');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('carrier')->nullable()->after('courier');
            $table->string('service_level')->default('STANDARD')->after('carrier');
            $table->unsignedInteger('delivery_fee_paise')->default(0)->after('service_level');
            $table->timestamp('promised_by')->nullable()->after('delivery_fee_paise');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['weight_grams', 'length_cm', 'width_cm', 'height_cm', 'requires_vehicle']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['carrier', 'service_level', 'delivery_fee_paise', 'promised_by']);
        });
    }
};
