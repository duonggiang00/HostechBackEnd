<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('contracts')
            ->where('status', 'ENDED')
            ->update(['status' => 'TERMINATED']);

        DB::table('contract_status_histories')
            ->where('from_status', 'ENDED')
            ->update(['from_status' => 'TERMINATED']);

        DB::table('contract_status_histories')
            ->where('to_status', 'ENDED')
            ->update(['to_status' => 'TERMINATED']);
    }

    public function down(): void
    {
        // Không rollback dữ liệu trạng thái để tránh ghi đè các bản ghi TERMINATED hợp lệ phát sinh sau migration.
    }
};
