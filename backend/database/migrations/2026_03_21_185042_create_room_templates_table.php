<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('room_type', 20)->default('apartment');
            $table->decimal('area', 8, 2)->nullable();
            $table->integer('capacity')->default(1);
            $table->decimal('base_price', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->json('amenities')->nullable();
            $table->json('utilities')->nullable();

            // Dynamic Service Linking: Chỉ định dịch vụ điện/nước cố định cho mẫu phòng
            $table->uuid('electric_service_id')->nullable()->comment('Dịch vụ điện mặc định');
            $table->foreign('electric_service_id')->references('id')->on('services')->onDelete('set null');
            $table->uuid('water_service_id')->nullable()->comment('Dịch vụ nước mặc định');
            $table->foreign('water_service_id')->references('id')->on('services')->onDelete('set null');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['property_id']);
        });

        Schema::create('room_template_services', function (Blueprint $table) {
            $table->foreignUuid('room_template_id')->constrained('room_templates')->cascadeOnDelete();
            $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
            $table->primary(['room_template_id', 'service_id']);
        });

        Schema::create('room_template_assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('room_template_id')->constrained('room_templates')->cascadeOnDelete();
            $table->string('name', 255);
            $table->timestamps();
        });

        // Không tạo room_template_meters nữa (đồng hồ luôn tự sinh: 1 ELECTRIC + 1 WATER khi publish)
    }

    public function down(): void
    {
        Schema::dropIfExists('room_template_assets');
        Schema::dropIfExists('room_template_services');
        Schema::dropIfExists('room_templates');
    }
};
