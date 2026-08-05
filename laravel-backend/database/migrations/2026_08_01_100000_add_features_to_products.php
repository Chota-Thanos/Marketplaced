<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The admin form has always had a "Key Features" bullet-list tab, but
        // nothing on the backend accepted it — every feature typed in was
        // silently discarded on save.
        Schema::table('products', function (Blueprint $table) {
            $table->json('features')->nullable()->after('tags');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('features');
        });
    }
};
