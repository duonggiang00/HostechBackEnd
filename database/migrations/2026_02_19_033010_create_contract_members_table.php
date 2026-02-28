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
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->string('full_name')->comment('Họ tên người thuê');
            $table->string('phone', 20)->nullable()->comment('Số điện thoại');
            $table->string('identity_number', 50)->nullable()->comment('CMND/CCCD/Passport');
            
            $table->string('role', 10)->default('TENANT')->comment('ENUM: TENANT, ROOMMATE, GUARANTOR');
            $table->string('status', 20)->default('APPROVED')->comment('ENUM: PENDING, APPROVED, REJECTED');
            $table->boolean('is_primary')->default(false);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            
            $table->timestamps();

            // Replace the unique index on user_id with index since user_id can be null
            $table->index(['contract_id', 'user_id']);
            // A person shouldn't be added twice to the same contract with the same phone (optional uniqueness, but let's stick to simple indexing for now)
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
