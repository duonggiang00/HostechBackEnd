<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('mfa_secret_encrypted', 'two_factor_secret');
            $table->renameColumn('mfa_enrolled_at', 'two_factor_confirmed_at');
            $table->text('two_factor_recovery_codes')->nullable()->after('mfa_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('two_factor_secret', 'mfa_secret_encrypted');
            $table->renameColumn('two_factor_confirmed_at', 'mfa_enrolled_at');
            $table->dropColumn('two_factor_recovery_codes');
        });
    }
};
