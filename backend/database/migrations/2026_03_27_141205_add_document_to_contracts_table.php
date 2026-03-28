<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            // Đường dẫn file hợp đồng đã được tạo (DOCX/PDF)
            $table->string('document_path')->nullable()->after('meta');
            // Loại file: docx | pdf
            $table->string('document_type', 10)->nullable()->after('document_path');
            // Lưu lại tên gốc file scan (nếu có)
            $table->string('scan_original_filename')->nullable()->after('document_type');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['document_path', 'document_type', 'scan_original_filename']);
        });
    }
};
