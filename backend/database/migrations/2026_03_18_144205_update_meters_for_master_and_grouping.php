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
        Schema::table('meters', function (Blueprint $table) {
            $table->uuid('room_id')->nullable()->change();
            $table->uuid('property_id')->after('org_id')->index()->comment('Gắn vào tòa nhà');
            $table->boolean('is_master')->default(false)->after('property_id')->comment('Cờ xác định đồng hồ tổng');
            $table->uuid('service_id')->nullable()->after('is_master')->index()->comment('Liên kết với dịch vụ/biểu giá');
            
            $table->foreign('property_id')->references('id')->on('properties')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meters', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
            $table->dropForeign(['service_id']);
            $table->dropColumn(['property_id', 'is_master', 'service_id']);
            $table->uuid('room_id')->nullable(false)->change();
        });
    }
};
