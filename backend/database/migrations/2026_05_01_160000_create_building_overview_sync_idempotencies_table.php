<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('building_overview_sync_idempotencies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('property_id');
            $table->uuid('idempotency_key');
            $table->string('payload_hash', 64);
            $table->timestamps();

            $table->unique(['property_id', 'idempotency_key'], 'bov_sync_prop_idem_uq');
            $table->foreign('property_id', 'bov_sync_prop_fk')->references('id')->on('properties')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('building_overview_sync_idempotencies');
    }
};
