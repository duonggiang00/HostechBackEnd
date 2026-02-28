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

        Schema::create('ticket_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id')->index();
            $table->uuid('ticket_id')->index();
            $table->uuid('actor_user_id')->nullable()->index();
            
            $table->string('type', 50);
            $table->text('message')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();

            // Foreign keys
            $table->foreign('org_id')->references('id')->on('orgs')->onDelete('cascade');
            $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('cascade');
            $table->foreign('actor_user_id')->references('id')->on('users')->onDelete('set null');
        });

        Schema::create('ticket_costs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id')->index();
            $table->uuid('ticket_id')->index();
            
            $table->decimal('amount', 15, 2);
            $table->string('payer', 10)->default('OWNER'); // ENUM: OWNER, TENANT
            $table->text('note')->nullable();
            $table->uuid('created_by_user_id')->index();
            
            $table->timestamp('created_at')->useCurrent();

            // Foreign keys
            $table->foreign('org_id')->references('id')->on('orgs')->onDelete('cascade');
            $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('cascade');
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_costs');
        Schema::dropIfExists('ticket_events');
        Schema::dropIfExists('tickets');
    }
};
