<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_status_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('contract_id')->constrained('contracts')->cascadeOnDelete();

            // Trạng thái trước và sau khi thay đổi
            $table->string('from_status', 30)->nullable()->comment('Trạng thái trước khi đổi');
            $table->string('to_status', 30)->comment('Trạng thái sau khi đổi');

            // Ai thực hiện thay đổi
            $table->foreignUuid('changed_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Ghi chú (tự động hoặc thủ công)
            $table->text('notes')->nullable();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();

            $table->index(['contract_id', 'created_at']);
            $table->index('org_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_status_histories');
    }
};
