<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Generic key/value store for platform settings (COD rules, loyalty
        // rates, referral rewards) so admins can change them without a deploy.
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->json('value');
            $table->timestamps();
        });

        Schema::create('homepage_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type'); // HERO, CATEGORY_GRID, PRODUCT_ROW, BANNER, REELS, TRUST
            $table->string('title')->nullable();
            $table->string('subtitle')->nullable();
            // For PRODUCT_ROW: which collection feeds it (trending/new/picked/category)
            $table->string('source')->nullable();
            $table->uuid('category_id')->nullable();
            $table->string('image_url')->nullable();
            $table->string('link_url')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
        });

        // 360° spin frames, ordered.
        Schema::table('products', function (Blueprint $table) {
            $table->json('spin_images')->nullable();
            $table->boolean('cod_available')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['spin_images', 'cod_available']);
        });
        Schema::dropIfExists('homepage_sections');
        Schema::dropIfExists('settings');
    }
};
