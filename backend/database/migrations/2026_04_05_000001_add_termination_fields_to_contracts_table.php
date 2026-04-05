<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            // ── Ai là người khởi xướng hủy hợp đồng ───────────────────────────
            $table->string('cancellation_party', 20)->nullable()->after('terminated_at')
                ->comment('ENUM: LANDLORD, TENANT, MUTUAL');

            // ── Lý do hủy ───────────────────────────────────────────────────────
            $table->text('cancellation_reason')->nullable()->after('cancellation_party');

            // ── Thời điểm hủy chính thức ────────────────────────────────────────
            $table->timestamp('cancelled_at')->nullable()->after('cancellation_reason');

            // ── Số ngày phải báo trước khi dời đi (mặc định 30 ngày) ───────────
            $table->unsignedTinyInteger('notice_days')->default(30)->after('cancelled_at')
                ->comment('Số ngày phải báo trước khi chấm dứt HĐ');

            // ── Thời điểm Tenant gửi thông báo dời đi ──────────────────────────
            $table->timestamp('notice_given_at')->nullable()->after('notice_days');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn([
                'cancellation_party',
                'cancellation_reason',
                'cancelled_at',
                'notice_days',
                'notice_given_at',
            ]);
        });
    }
};
