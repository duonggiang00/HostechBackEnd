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
        Schema::create('penalty_rules', function (Blueprint $blueprint) {
            $blueprint->uuid('id')->primary();
            $blueprint->foreignUuid('org_id')->constrained('orgs')->onDelete('cascade');
            $blueprint->foreignUuid('property_id')->nullable()->constrained('properties')->onDelete('cascade');
            
            $blueprint->string('type', 30)->comment('LATE_PAYMENT, EARLY_TERMINATION, DAMAGE, etc.');
            $blueprint->string('calc_mode', 20)->comment('FIXED, PERCENT_RENT, PERCENT_DEPOSIT, PER_DAY');
            $blueprint->decimal('value', 15, 2);
            $blueprint->integer('grace_days')->default(0);
            
            $blueprint->boolean('is_active')->default(true);
            $blueprint->timestamps();
            $blueprint->softDeletes();

            $blueprint->index(['org_id', 'type']);
            $blueprint->index(['property_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penalty_rules');
    }
};
