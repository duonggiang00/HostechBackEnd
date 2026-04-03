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
            $table->decimal('base_rent', 15, 2)->default(0)->after('room_id')->comment('Giá thuê cơ bản tại thời điểm ký');
            $table->decimal('fixed_services_fee', 15, 2)->default(0)->after('base_rent')->comment('Tổng phí dịch vụ cố định');
            $table->decimal('total_rent', 15, 2)->default(0)->after('fixed_services_fee')->comment('Tổng tiền phòng thực tế (base + fixed)');
            $table->integer('cycle_months')->default(6)->after('total_rent')->comment('Chu kỳ hợp đồng (tháng)');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['base_rent', 'fixed_services_fee', 'total_rent', 'cycle_months']);
        });
    }
};
