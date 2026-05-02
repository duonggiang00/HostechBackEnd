<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasIndex('users', 'users_org_id_phone_unique')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_org_id_phone_unique');
            });
        }

        if (! Schema::hasIndex('users', 'users_org_id_phone_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index(['org_id', 'phone'], 'users_org_id_phone_index');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasIndex('users', 'users_org_id_phone_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex('users_org_id_phone_index');
            });
        }

        if (! Schema::hasIndex('users', 'users_org_id_phone_unique')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unique(['org_id', 'phone'], 'users_org_id_phone_unique');
            });
        }
    }
};
