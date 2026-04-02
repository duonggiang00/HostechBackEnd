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
        Schema::table('contracts', function (Blueprint $table) {
            $table->string('deposit_status', 50)->default('PENDING')->after('deposit_amount');
            $table->decimal('refunded_amount', 15, 2)->default(0)->after('deposit_status');
            $table->decimal('forfeited_amount', 15, 2)->default(0)->after('refunded_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['deposit_status', 'refunded_amount', 'forfeited_amount']);
        });
    }
};
