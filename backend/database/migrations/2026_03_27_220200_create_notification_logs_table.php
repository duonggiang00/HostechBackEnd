<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id');
            $table->uuid('rule_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('channel', 20);
            $table->string('status', 20)->comment('SENT, FAILED, PENDING');
            $table->string('provider_id', 255)->nullable()
                ->comment('External provider message ID (SMS/email)');
            $table->json('payload')->nullable()
                ->comment('Full rendered content that was sent');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('org_id')->references('id')->on('orgs')->cascadeOnDelete();
            $table->foreign('rule_id')->references('id')->on('notification_rules')->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();

            $table->index('org_id');
            $table->index('created_at');
            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
    }
};
