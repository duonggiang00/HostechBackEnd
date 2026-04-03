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
        // Using raw SQL for compatibility with MySQL Enum update
        DB::statement("ALTER TABLE invoice_items MODIFY COLUMN type ENUM('RENT', 'SERVICE', 'DEPOSIT', 'PENALTY', 'DISCOUNT', 'ADJUSTMENT') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE invoice_items MODIFY COLUMN type ENUM('RENT', 'SERVICE', 'PENALTY', 'DISCOUNT', 'ADJUSTMENT') NOT NULL");
    }
};
