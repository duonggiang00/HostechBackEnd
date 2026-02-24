<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bảng room_photos
        Schema::create('room_photos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->text('path');
            $table->string('mime', 100)->nullable();
            $table->bigInteger('size_bytes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('org_id');
            $table->index('room_id');
        });

        // Bảng room_assets
        Schema::create('room_assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('serial', 100)->nullable();
            $table->string('condition', 50)->nullable();
            $table->date('purchased_at')->nullable();
            $table->date('warranty_end')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('org_id');
            $table->index('room_id');
        });

        // Bảng room_prices
        Schema::create('room_prices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->date('effective_from');
            $table->decimal('price', 15, 2);
            $table->foreignUuid('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['room_id', 'effective_from']);
            $table->index('org_id');
            $table->index('room_id');
            $table->index('effective_from');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_prices');
        Schema::dropIfExists('room_assets');
        Schema::dropIfExists('room_photos');
    }
};
