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
        Schema::table('properties', function (Blueprint $table) {
            $table->decimal('default_rent_price_per_m2', 15, 2)->nullable()->after('note');
            $table->integer('default_deposit_months')->default(1)->after('default_rent_price_per_m2');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn(['default_rent_price_per_m2', 'default_deposit_months']);
        });
    }
};
