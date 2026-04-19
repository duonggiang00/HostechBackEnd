<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add service_id column to meters table.
 * This column links a meter to a specific Service for price calculation.
 * Required by MeterFactory and existing test fixtures.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meters', function (Blueprint $table) {
            if (!Schema::hasColumn('meters', 'service_id')) {
                $table->foreignUuid('service_id')->nullable()->after('type')
                    ->constrained('services')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('meters', function (Blueprint $table) {
            if (Schema::hasColumn('meters', 'service_id')) {
                $table->dropForeign(['service_id']);
                $table->dropColumn('service_id');
            }
        });
    }
};
