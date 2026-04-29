<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refund_receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id');
            $table->uuid('contract_id');
            $table->decimal('amount', 14, 2);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->foreign('org_id')->references('id')->on('orgs')->cascadeOnDelete();
            $table->foreign('contract_id')->references('id')->on('contracts')->cascadeOnDelete();
            $table->index(['org_id', 'contract_id']);
        });

        Schema::create('final_payment_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id');
            $table->uuid('contract_id');
            $table->uuid('invoice_id');
            $table->decimal('amount_due', 14, 2);
            $table->string('status', 20)->default('PENDING');
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->foreign('org_id')->references('id')->on('orgs')->cascadeOnDelete();
            $table->foreign('contract_id')->references('id')->on('contracts')->cascadeOnDelete();
            $table->foreign('invoice_id')->references('id')->on('invoices')->cascadeOnDelete();
            $table->index(['org_id', 'contract_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('final_payment_requests');
        Schema::dropIfExists('refund_receipts');
    }
};
