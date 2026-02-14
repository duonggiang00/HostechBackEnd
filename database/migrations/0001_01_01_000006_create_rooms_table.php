<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('floor_id')->nullable()->constrained('floors')->nullOnDelete();
            $table->string('code', 50);
            $table->string('name', 255);
            $table->string('type', 20)->default('apartment');
            $table->decimal('area', 8, 2)->nullable();
            $table->integer('floor')->nullable();
            $table->integer('capacity')->default(1);
            $table->decimal('base_price', 15, 2)->default(0);
            $table->string('status', 20)->default('available');
            $table->text('description')->nullable();
            $table->json('amenities')->nullable();
            $table->json('utilities')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['property_id', 'code']);
            $table->index(['property_id', 'status']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
