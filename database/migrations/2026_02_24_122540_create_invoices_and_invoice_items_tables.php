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
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('contract_id')->constrained('contracts')->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();

            $table->date('period_start');
            $table->date('period_end');
            $table->string('status', 10)->default('DRAFT')->comment('ENUM: DRAFT, ISSUED, PENDING, PAID, OVERDUE, CANCELLED');
            $table->date('issue_date')->nullable();
            $table->date('due_date');

            $table->decimal('total_amount', 15, 2)->default(0.00);
            $table->decimal('paid_amount', 15, 2)->default(0.00);

            $table->json('snapshot')->nullable()->comment('Immutable snapshot');

            $table->foreignUuid('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('issued_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('issued_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->unique(['contract_id', 'period_start', 'period_end'], 'inv_unique_period');
            $table->index('org_id');
            $table->index('property_id');
            $table->index('room_id');
            $table->index('status');
            $table->index('due_date');
            $table->index(['contract_id', 'period_start'], 'inv_contract_period_idx');
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('invoice_id')->constrained('invoices')->cascadeOnDelete();

            $table->string('type', 15)->comment('ENUM: RENT, SERVICE, PENALTY, DISCOUNT, ADJUSTMENT');
            $table->foreignUuid('service_id')->nullable()->constrained('services')->nullOnDelete();

            $table->string('description', 255);
            $table->decimal('quantity', 12, 2)->default(1.00);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('amount', 15, 2);

            $table->json('meta')->nullable();

            // invoice_items usually don't need updated_at, just created_at is okay as per DBML
            $table->timestamp('created_at')->nullable();

            $table->index('org_id');
            $table->index('invoice_id');
            $table->index('service_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
    }
};
