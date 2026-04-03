<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Thêm cột deleted_at vào bảng payments để hỗ trợ SoftDeletes.
     * Bảng này được tạo trong migration 2026_03_16_134803 nhưng thiếu softDeletes().
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->softDeletes()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
