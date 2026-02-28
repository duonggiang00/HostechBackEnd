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
        Schema::create('adjustment_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            // Assuming meter_readings table migration already exists, or it has been defined. 
            // In case of FK constraints issue because of order, we use restricted constrained.
            $table->foreignUuid('meter_reading_id')->constrained('meter_readings')->cascadeOnDelete();
            
            $table->text('reason');
            $table->bigInteger('before_value');
            $table->bigInteger('after_value');
            
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->foreignUuid('requested_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            
            $table->foreignUuid('rejected_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->text('reject_reason')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('org_id');
            $table->index('meter_reading_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adjustment_notes');
    }
};
