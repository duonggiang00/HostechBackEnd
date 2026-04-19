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
        Schema::create('document_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id');
            $table->uuid('property_id')->nullable();
            
            $table->string('type', 20)->comment('CONTRACT, ANNEX, HANDOVER, INVOICE, RECEIPT');
            $table->string('format', 10)->default('HTML')->comment('HTML or DOCX');
            $table->string('name', 255);
            
            $table->longText('content')->nullable()->comment('HTML content for DOMPDF rendering');
            $table->string('file_path', 255)->nullable()->comment('Storage path for .docx fallback/template');
            
            $table->json('variables')->nullable()->comment('List of supported variables for placeholders');
            $table->integer('version')->default(1);
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();

            // Indexes
            $table->index('org_id');
            $table->index('property_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_templates');
    }
};
