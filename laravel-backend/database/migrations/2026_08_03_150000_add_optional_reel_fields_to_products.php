<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets a product optionally carry a short-video clip for the Reels feed.
 *
 * Both columns are nullable with no default that implies a requirement.
 * Shoppertainment is a layer on top of the catalogue, not a condition of
 * selling something — most sellers will never record a clip for most
 * products, and the schema has to make that the unremarkable case rather
 * than one every product listing has to actively opt out of.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('reel_video_url')->nullable()->after('spin_images');
            $table->string('reel_caption')->nullable()->after('reel_video_url');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['reel_video_url', 'reel_caption']);
        });
    }
};
