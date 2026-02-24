<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tiered_rates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('service_rate_id')->constrained('service_rates')->cascadeOnDelete();
            $table->integer('tier_from');
            $table->integer('tier_to')->nullable();
            $table->decimal('price', 15, 2);
            
            $table->index('org_id');
            $table->index('service_rate_id');
        });

        Schema::create('room_services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->integer('included_units')->default(0)->comment('Số đơn vị bao');
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['room_id', 'service_id']);
            $table->index('org_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_services');
        Schema::dropIfExists('tiered_rates');
    }
};
