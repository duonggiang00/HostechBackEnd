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
        Schema::table('services', function (Blueprint $table) {
            $table->uuid('property_id')->nullable()->after('org_id')->index()->comment('Gắn vào tòa nhà (Nếu NULL là dịch vụ chung toàn Org)');
            
            // Drop old unique and add new one
            $table->dropUnique(['org_id', 'code']);
            $table->unique(['org_id', 'property_id', 'code']);

            $table->foreign('property_id')->references('id')->on('properties')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
            $table->dropUnique(['org_id', 'property_id', 'code']);
            $table->dropColumn('property_id');

            $table->unique(['org_id', 'code']);
        });
    }
};
