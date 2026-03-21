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
        // 1. Update Properties
        Schema::table('properties', function (Blueprint $table) {
            if (!Schema::hasColumn('properties', 'default_billing_cycle')) {
                $table->string('default_billing_cycle')->default('MONTHLY')->after('use_floors');
            }
            if (!Schema::hasColumn('properties', 'default_due_day')) {
                $table->integer('default_due_day')->default(5)->after('default_billing_cycle');
            }
            if (!Schema::hasColumn('properties', 'default_cutoff_day')) {
                $table->integer('default_cutoff_day')->default(31)->after('default_due_day');
            }
            if (!Schema::hasColumn('properties', 'default_rent_price_per_m2')) {
                $table->decimal('default_rent_price_per_m2', 15, 2)->nullable()->after('default_cutoff_day');
            }
            if (!Schema::hasColumn('properties', 'default_deposit_months')) {
                $table->integer('default_deposit_months')->default(1)->after('default_rent_price_per_m2');
            }
        });

        // 2. Update Rooms
        Schema::table('rooms', function (Blueprint $table) {
            if (!Schema::hasColumn('rooms', 'base_price')) {
                $table->decimal('base_price', 15, 2)->default(0)->after('capacity');
            }
            if (!Schema::hasColumn('rooms', 'area')) {
                $table->decimal('area', 8, 2)->nullable()->after('type');
            }
        });

        // 3. Update Contracts
        Schema::table('contracts', function (Blueprint $table) {
             if (!Schema::hasColumn('contracts', 'next_billing_date')) {
                $table->date('next_billing_date')->nullable()->after('start_date');
            }
            if (!Schema::hasColumn('contracts', 'billing_cycle')) {
                $table->string('billing_cycle')->default('MONTHLY')->after('end_date');
            }
            if (!Schema::hasColumn('contracts', 'due_day')) {
                $table->integer('due_day')->default(5)->after('billing_cycle');
            }
            if (!Schema::hasColumn('contracts', 'cutoff_day')) {
                $table->integer('cutoff_day')->default(31)->after('due_day');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn(['default_billing_cycle', 'default_due_day', 'default_cutoff_day', 'default_rent_price_per_m2', 'default_deposit_months']);
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn(['base_price', 'area']);
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['next_billing_date', 'billing_cycle', 'due_day', 'cutoff_day']);
        });
    }
};
