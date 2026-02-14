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
        Schema::create('services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id');
            $table->string('code',20)->nullable(false);
            $table->string('name',255)->nullable(false);
            $table->string('calc_mode',20)->nullable(false);
            $table->string('unit',20)->nullable(false);
            $table->boolean('is_recurring')->default(true)->nullable(false);
            $table->boolean('is_active')->default(true)->nullable(false);
            $table->json('meta')->nullable(true);
            $table->timestamps();
            $table->softDeletes();
            
            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
