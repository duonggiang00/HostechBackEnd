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
        Schema::create('property_user', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('property_id');
            $table->foreign('property_id')->references('id')->on('properties')->onDelete('cascade');
            
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->timestamps();

            $table->unique(['property_id', 'user_id']); // Ensure uniqueness
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_user');
    }
};
