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
        // Add license_plate to users
        Schema::table('users', function (Blueprint $table) {
            $table->string('license_plate', 50)->nullable()->after('address');
        });

        // Add bank_accounts to orgs
        Schema::table('orgs', function (Blueprint $table) {
            $table->json('bank_accounts')->nullable()->after('address');
        });

        // Add DOB and license_plate to contract_members snapshot
        Schema::table('contract_members', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('identity_number');
            $table->string('license_plate', 50)->nullable()->after('date_of_birth');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('license_plate');
        });

        Schema::table('orgs', function (Blueprint $table) {
            $table->dropColumn('bank_accounts');
        });

        Schema::table('contract_members', function (Blueprint $table) {
            $table->dropColumn(['date_of_birth', 'license_plate']);
        });
    }
};
