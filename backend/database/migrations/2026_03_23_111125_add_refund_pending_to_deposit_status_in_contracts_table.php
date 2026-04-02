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
        DB::statement("ALTER TABLE contracts MODIFY COLUMN deposit_status VARCHAR(255) DEFAULT 'PENDING'");
        
        // 2. Normalize to UPPERCASE
        DB::table('contracts')->update([
            'deposit_status' => DB::raw('UPPER(deposit_status)')
        ]);

        // 3. Set to final ENUM (Including PENDING and PAID from PHP Enum)
        DB::statement("ALTER TABLE contracts MODIFY COLUMN deposit_status ENUM('PENDING', 'PAID', 'UNPAID', 'HELD', 'REFUND_PENDING', 'REFUNDED', 'PARTIAL_REFUND', 'FORFEITED') DEFAULT 'PENDING'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE contracts MODIFY COLUMN deposit_status ENUM('unpaid', 'held', 'refunded', 'partial_refund', 'forfeited') DEFAULT 'unpaid'");
    }
};
