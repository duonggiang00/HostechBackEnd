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
        Schema::table('meter_readings', function (Blueprint $table) {
            // Index for high-performance historical lookup per meter
            $table->index(['meter_id', 'period_end'], 'idx_meter_history');
            
            // Index for status-based filtering per meter (Submit/Approve flow)
            $table->index(['meter_id', 'status'], 'idx_meter_status');
            
            // Index for org-wide status auditing (MeterListPage)
            $table->index(['org_id', 'status', 'period_end'], 'idx_org_meter_audit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meter_readings', function (Blueprint $table) {
            $table->dropIndex('idx_meter_history');
            $table->dropIndex('idx_meter_status');
            $table->dropIndex('idx_org_meter_audit');
        });
    }
};
