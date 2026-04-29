<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('mfa_methods')->nullable()->after('mfa_method');
        });

        // Backfill: migrate existing mfa_method/mfa_enabled into mfa_methods array
        DB::table('users')
            ->whereNotNull('mfa_method')
            ->where('mfa_enabled', true)
            ->orderBy('id')
            ->chunk(200, function ($users) {
                foreach ($users as $user) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['mfa_methods' => json_encode([$user->mfa_method])]);
                }
            });

        // Users with mfa_enabled = false get empty array
        DB::table('users')
            ->where('mfa_enabled', false)
            ->orWhereNull('mfa_enabled')
            ->whereNull('mfa_methods')
            ->update(['mfa_methods' => json_encode([])]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('mfa_methods');
        });
    }
};
