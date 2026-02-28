<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id')->index();
            $table->uuid('property_id')->index();
            $table->uuid('room_id')->index();
            $table->uuid('contract_id')->nullable()->index();

            $table->uuid('created_by_user_id')->index();
            $table->uuid('assigned_to_user_id')->nullable()->index();

            $table->string('category', 100)->nullable();
            $table->string('priority', 10)->default('MEDIUM')->index(); // ENUM: LOW, MEDIUM, HIGH, URGENT
            $table->string('status', 20)->default('OPEN')->index();     // ENUM: OPEN, RECEIVED, IN_PROGRESS, WAITING_PARTS, DONE, CANCELLED

            $table->text('description');

            $table->timestamp('due_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('org_id')->references('id')->on('orgs')->onDelete('cascade');
            $table->foreign('property_id')->references('id')->on('properties')->onDelete('cascade');
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('set null');
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('assigned_to_user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
