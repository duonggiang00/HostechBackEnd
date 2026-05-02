<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            // Số tháng cọc — minh bạch hoá công thức (rent + fixed_services_fee) × deposit_months.
            // Default 0 = "chưa biết" → ContractDocumentService fallback sang reverse-calc deposit_amount/total_rent
            // (giữ tương thích cho HĐ legacy đã tồn tại trước migration). HĐ tạo qua ContractService::create
            // luôn ghi đè bằng số tháng thực (clamp 1..24).
            $table->unsignedTinyInteger('deposit_months')->default(0)->after('deposit_amount');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn('deposit_months');
        });
    }
};
