<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_floor_plan_nodes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('floor_id')->constrained('floors')->cascadeOnDelete();
            $table->foreignUuid('room_id')->unique()->constrained('rooms')->cascadeOnDelete();
            $table->decimal('x', 8, 2)->default(0);
            $table->decimal('y', 8, 2)->default(0);
            $table->decimal('width', 8, 2)->default(100);
            $table->decimal('height', 8, 2)->default(60);
            $table->decimal('rotation', 5, 2)->default(0);
            $table->string('label', 50)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('org_id');
            $table->index('floor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_floor_plan_nodes');
    }
};
