<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('floors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id');
            $table->uuid('property_id');
            $table->string('code', 50)->nullable();
            $table->string('name', 255);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->timestamp('deleted_at')->nullable();

            $table->unique(['property_id', 'code']);
            $table->index(['org_id']);
            $table->index(['property_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('floors');
    }
};
