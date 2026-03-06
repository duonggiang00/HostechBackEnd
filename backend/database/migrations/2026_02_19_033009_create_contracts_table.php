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
        Schema::create('contracts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->string('status', 10)->default('DRAFT')->comment('ENUM: DRAFT, ACTIVE, ENDED, CANCELLED');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('billing_cycle', 10)->default('MONTHLY')->comment('ENUM: MONTHLY, QUARTERLY');
            $table->integer('due_day')->default(5);
            $table->integer('cutoff_day')->default(30);
            $table->decimal('rent_price', 15, 2);
            $table->decimal('deposit_amount', 15, 2)->default(0.00);
            $table->string('join_code', 64)->nullable();
            $table->timestamp('join_code_expires_at')->nullable();
            $table->timestamp('join_code_revoked_at')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamp('terminated_at')->nullable();
            $table->foreignUuid('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['org_id', 'join_code']);
            $table->index(['property_id', 'status']);
            $table->index('status');
            $table->index('end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
