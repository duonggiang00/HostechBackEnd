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
        Schema::create('generated_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id');
            $table->uuid('template_id')->nullable();
            
            $table->uuidMorphs('owner'); // owner_type, owner_id (e.g. Contract)
            
            $table->string('path', 1000);
            $table->string('sha256', 64)->nullable();
            
            $table->timestamps();

            // Indexes
            $table->index('org_id');
            $table->index('template_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_documents');
    }
};
