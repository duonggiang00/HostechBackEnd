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
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->uuid('property_id')->nullable()->comment('Cấp độ tòa nhà (nếu null là dùng chung)');
            $table->foreign('property_id')->references('id')->on('properties')->onDelete('cascade');
            $table->string('code', 50);
            $table->string('name', 255);
            $table->string('type', 20)->default('OTHER')->comment('ENUM: ELECTRIC, WATER, OTHER');
            $table->string('calc_mode', 20)->comment('ENUM: PER_ROOM, PER_PERSON, PER_QUANTITY, PER_METER');
            $table->string('unit', 20);
            $table->boolean('is_recurring')->default(true);
            $table->boolean('is_active')->default(true);
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['org_id', 'property_id', 'code'], 'org_prop_code_unique');
            $table->index(['org_id']);
            $table->index('type');
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
