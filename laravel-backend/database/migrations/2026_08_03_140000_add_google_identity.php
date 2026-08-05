<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Google's `sub` claim — stable for the lifetime of the account and
            // the only safe join key. Email is not: Google Workspace addresses
            // get reassigned, and matching on email alone lets whoever inherits
            // an address inherit the account with it.
            $table->string('google_id')->nullable()->unique()->after('password');

            // How the account was created. Matters because a Google-only user
            // has no password, and "reset your password" is nonsense advice for
            // them — they need "sign in with Google" instead.
            $table->string('auth_provider')->default('PASSWORD')->after('google_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'auth_provider']);
        });
    }
};
