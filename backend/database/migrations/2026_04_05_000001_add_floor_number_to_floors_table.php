<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('floors', function (Blueprint $table) {
            // Số tầng hiển thị (1, 2, 3...) — khác sort_order (thứ tự sắp xếp)
            $table->integer('floor_number')->default(1)->after('name')->comment('Số tầng (1, 2, 3...)');
            $table->index('floor_number');
        });

        // Backfill: đặt floor_number = sort_order + 1 cho dữ liệu hiện có
        // Nếu sort_order = 0 thì floor_number = 1
        DB::statement('UPDATE floors SET floor_number = GREATEST(sort_order, 1)');
    }

    public function down(): void
    {
        Schema::table('floors', function (Blueprint $table) {
            $table->dropIndex(['floor_number']);
            $table->dropColumn('floor_number');
        });
    }
};
