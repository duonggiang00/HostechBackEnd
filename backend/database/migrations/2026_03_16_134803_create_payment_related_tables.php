<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('payer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('received_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('method', 10)->comment('ENUM: CASH, TRANSFER, WALLET, QR');
            $table->decimal('amount', 15, 2);
            $table->string('reference', 255)->nullable();
            $table->timestamp('received_at')->nullable();
            $table->string('status', 10)->default('APPROVED')->comment('ENUM: PENDING, APPROVED, REJECTED');
            $table->foreignUuid('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('note')->nullable();
            $table->string('provider_ref', 255)->nullable();
            $table->string('provider_status', 50)->nullable();
            $table->json('webhook_payload')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index('received_at');
            $table->index(['received_at', 'status']);
            $table->index('status');
            $table->index('method');
        });

        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->foreignUuid('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['payment_id', 'invoice_id']);
        });

        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('ref_type', 50);
            $table->uuid('ref_id');
            $table->decimal('debit', 15, 2)->default(0.00);
            $table->decimal('credit', 15, 2)->default(0.00);
            $table->timestamp('occurred_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['ref_type', 'ref_id']);
            $table->index('occurred_at');
        });

        Schema::create('receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->text('path');
            $table->string('sha256', 64)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique('payment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
        Schema::dropIfExists('ledger_entries');
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('payments');
    }
};
