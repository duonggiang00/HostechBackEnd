<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('room_template_assets', function (Blueprint $table) {
            $table->string('condition')->default('new')->after('name');
            $table->text('note')->nullable()->after('condition');
            $table->unsignedInteger('quantity')->default(1)->after('note');
        });
    }

    public function down(): void
    {
        Schema::table('room_template_assets', function (Blueprint $table) {
            $table->dropColumn(['condition', 'note', 'quantity']);
        });
    }
};
