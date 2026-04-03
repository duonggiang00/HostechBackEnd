<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Use raw SQL for robust enum transition
        // 1. Change to VARCHAR temporarily
        DB::statement("ALTER TABLE contracts MODIFY COLUMN deposit_status VARCHAR(255) DEFAULT 'UNPAID'");
        
        // 2. Map PENDING (unexpected status) to UNPAID and normalize others to UPPERCASE
        DB::table('contracts')->where('deposit_status', 'PENDING')->update(['deposit_status' => 'UNPAID']);
        DB::table('contracts')->update([
            'deposit_status' => DB::raw('UPPER(deposit_status)')
        ]);

        // 3. Set to final ENUM
        DB::statement("ALTER TABLE contracts MODIFY COLUMN deposit_status ENUM('UNPAID', 'HELD', 'REFUND_PENDING', 'REFUNDED', 'PARTIAL_REFUND', 'FORFEITED') DEFAULT 'UNPAID'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE contracts MODIFY COLUMN deposit_status ENUM('unpaid', 'held', 'refunded', 'partial_refund', 'forfeited') DEFAULT 'unpaid'");
    }
};
