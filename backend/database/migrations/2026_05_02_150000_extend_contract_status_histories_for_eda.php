<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_status_histories', function (Blueprint $table) {
            if (! Schema::hasColumn('contract_status_histories', 'event_type')) {
                $table->string('event_type', 40)
                    ->default('STATUS_CHANGE')
                    ->after('to_status')
                    ->comment('Loại sự kiện timeline (STATUS_CHANGE hoặc milestone EDA)');
            }

            if (! Schema::hasColumn('contract_status_histories', 'payload')) {
                $table->json('payload')
                    ->nullable()
                    ->after('notes')
                    ->comment('Dữ liệu kèm theo milestone (id invoice/handover/...) ');
            }
        });

        // Cho phép milestone event không có status snapshot (ví dụ CONTRACT_CREATED khi
        // chưa có status, hay event tổng quát). Trước đây to_status là NOT NULL.
        try {
            DB::statement('ALTER TABLE `contract_status_histories` MODIFY `to_status` VARCHAR(30) NULL');
        } catch (Throwable $e) {
            // Bỏ qua nếu DB đã ở trạng thái đúng / DB không phải MySQL.
        }

        // Thêm index hỗ trợ truy vấn theo loại sự kiện trong cùng hợp đồng
        Schema::table('contract_status_histories', function (Blueprint $table) {
            try {
                $table->index(['contract_id', 'event_type'], 'csh_contract_event_idx');
            } catch (Throwable $e) {
                // index có thể đã tồn tại (idempotent re-run)
            }
        });
    }

    public function down(): void
    {
        Schema::table('contract_status_histories', function (Blueprint $table) {
            try {
                $table->dropIndex('csh_contract_event_idx');
            } catch (Throwable $e) {
            }

            if (Schema::hasColumn('contract_status_histories', 'payload')) {
                $table->dropColumn('payload');
            }
            if (Schema::hasColumn('contract_status_histories', 'event_type')) {
                $table->dropColumn('event_type');
            }
        });
    }
};
