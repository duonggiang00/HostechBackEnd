<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('code', 50)->nullable();
            $table->string('name', 255);
            $table->text('address')->nullable();
            $table->text('note')->nullable();
            $table->boolean('use_floors')->default(true);
            $table->string('default_billing_cycle', 20)->default('MONTHLY');
            $table->integer('default_due_day')->default(5);
            $table->integer('default_cutoff_day')->default(30);
            $table->json('bank_accounts')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['org_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
