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
        Schema::create('user_invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            $table->string('email')->unique();
            $table->string('token')->unique();
            $table->string('role_name');
            
            // nullable because an invitation might be for an Owner (to create a new Org)
            $table->uuid('org_id')->nullable();
            $table->foreign('org_id')->references('id')->on('orgs')->onDelete('cascade');
            
            // Scope property_ids for Manager/Staff types
            $table->json('properties_scope')->nullable();
            
            $table->uuid('invited_by');
            $table->foreign('invited_by')->references('id')->on('users')->onDelete('cascade');
            
            $table->timestamp('expires_at');
            $table->timestamp('registered_at')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_invitations');
    }
};
