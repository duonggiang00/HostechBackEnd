<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('refund_receipts', function (Blueprint $table) {
            $table->string('reference', 32)->nullable()->after('amount');
            $table->string('pdf_path')->nullable()->after('reference');
            $table->char('pdf_sha256', 64)->nullable()->after('pdf_path');
            $table->timestamp('paid_at')->nullable()->after('pdf_sha256');
            $table->uuid('paid_by_user_id')->nullable()->after('paid_at');
            $table->string('payout_method', 20)->nullable()->after('paid_by_user_id');
            $table->string('payout_reference', 100)->nullable()->after('payout_method');

            $table->unique('reference');
            $table->foreign('paid_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['org_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::table('refund_receipts', function (Blueprint $table) {
            $table->dropForeign(['paid_by_user_id']);
            $table->dropUnique(['reference']);
            $table->dropIndex(['org_id', 'paid_at']);
            $table->dropColumn([
                'reference',
                'pdf_path',
                'pdf_sha256',
                'paid_at',
                'paid_by_user_id',
                'payout_method',
                'payout_reference',
            ]);
        });
    }
};
