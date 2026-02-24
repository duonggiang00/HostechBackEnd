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
        Schema::create('contract_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('contract_id')->constrained('contracts')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 10)->default('TENANT')->comment('ENUM: TENANT, ROOMMATE, GUARANTOR');
            $table->boolean('is_primary')->default(false);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            
            $table->timestamps();

            $table->unique(['contract_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_members');
    }
};
