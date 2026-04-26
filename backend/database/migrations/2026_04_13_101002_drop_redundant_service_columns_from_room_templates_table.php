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
        Schema::table('room_templates', function (Blueprint $table) {
            $table->dropForeign(['electric_service_id']);
            $table->dropForeign(['water_service_id']);
            $table->dropColumn(['electric_service_id', 'water_service_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_templates', function (Blueprint $table) {
            $table->char('electric_service_id', 36)->nullable()->comment('Dịch vụ điện mặc định');
            $table->char('water_service_id', 36)->nullable()->comment('Dịch vụ nước mặc định');
            
            $table->foreign('electric_service_id')->references('id')->on('services')->onDelete('set null');
            $table->foreign('water_service_id')->references('id')->on('services')->onDelete('set null');
        });
    }
};
