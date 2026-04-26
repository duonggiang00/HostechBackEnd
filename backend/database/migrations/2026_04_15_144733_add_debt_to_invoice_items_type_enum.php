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
        // MySQL specific ENUM update
        DB::statement("ALTER TABLE invoice_items MODIFY COLUMN type ENUM('RENT','SERVICE','DEPOSIT','PENALTY','DISCOUNT','ADJUSTMENT','DEBT') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: Removing 'DEBT' from enum might fail if there are records using it
        DB::statement("ALTER TABLE invoice_items MODIFY COLUMN type ENUM('RENT','SERVICE','DEPOSIT','PENALTY','DISCOUNT','ADJUSTMENT') NOT NULL");
    }
};
