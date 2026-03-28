<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id');
            $table->uuid('property_id')->nullable();
            $table->string('trigger', 100)
                ->comment('Event trigger, e.g. meter_reading_status_changed, contract_expiring_soon');
            $table->json('schedule')->nullable()
                ->comment('Cron schedule for scheduled rules');
            $table->uuid('template_id');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('org_id')->references('id')->on('orgs')->cascadeOnDelete();
            $table->foreign('property_id')->references('id')->on('properties')->nullOnDelete();
            $table->foreign('template_id')->references('id')->on('notification_templates')->cascadeOnDelete();

            $table->index('org_id');
            $table->index('property_id');
            $table->index('trigger');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_rules');
    }
};
