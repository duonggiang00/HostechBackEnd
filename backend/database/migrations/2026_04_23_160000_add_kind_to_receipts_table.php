<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropForeign(['payment_id']);
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->dropUnique(['payment_id']);
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->string('kind', 20)->default('OFFICIAL')->after('payment_id');
        });

        DB::table('receipts')->update(['kind' => 'OFFICIAL']);

        Schema::table('receipts', function (Blueprint $table) {
            $table->unique(['payment_id', 'kind']);
            $table->foreign('payment_id')->references('id')->on('payments')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropForeign(['payment_id']);
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->dropUnique(['payment_id', 'kind']);
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->dropColumn('kind');
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->unique('payment_id');
            $table->foreign('payment_id')->references('id')->on('payments')->cascadeOnDelete();
        });
    }
};
