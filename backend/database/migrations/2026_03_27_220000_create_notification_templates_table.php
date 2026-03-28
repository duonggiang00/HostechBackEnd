<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id');
            $table->uuid('property_id')->nullable();
            $table->string('code', 100);
            $table->string('channel', 10)->default('IN_APP')
                ->comment('ENUM: IN_APP, EMAIL, SMS, ZALO, PUSH');
            $table->string('title', 255)->nullable();
            $table->text('body');
            $table->json('variables')->nullable()
                ->comment('List of available placeholder variables');
            $table->unsignedInteger('version')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('org_id')->references('id')->on('orgs')->cascadeOnDelete();
            $table->foreign('property_id')->references('id')->on('properties')->nullOnDelete();

            $table->unique(['org_id', 'code', 'channel']);
            $table->index('org_id');
            $table->index('property_id');
            $table->index('code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_templates');
    }
};
