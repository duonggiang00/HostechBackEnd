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
        Schema::table('rooms', function (Blueprint $table) {
            $table->index(['property_id', 'status'], 'idx_rooms_prop_status');
            $table->index(['property_id', 'floor_id', 'status'], 'idx_rooms_prop_floor_status');
            $table->index(['property_id', 'type'], 'idx_rooms_prop_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropIndex('idx_rooms_prop_status');
            $table->dropIndex('idx_rooms_prop_floor_status');
            $table->dropIndex('idx_rooms_prop_type');
        });
    }
};
