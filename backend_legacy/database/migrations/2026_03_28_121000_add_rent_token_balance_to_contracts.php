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
            if (!Schema::hasColumn('contracts', 'rent_token_balance')) {
                $table->integer('rent_token_balance')->default(0)->after('billing_cycle')
                      ->comment('Số block/tháng tiền phòng đã đóng dư (dùng làm đếm ngược)');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn('rent_token_balance');
        });
    }
};
