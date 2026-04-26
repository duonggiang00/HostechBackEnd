<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Make contract_members.user_id nullable so that members created via email
 * invitation (Path B) or manual declaration (Path C) can be stored before
 * the tenant registers.
 *
 * Invitation tokens are stored in the existing `user_invitations` table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_members', function (Blueprint $table) {
            // MySQL cannot alter a column referenced by a FK — drop first
            $table->dropForeign(['user_id']);

            $table->string('user_id')->nullable()->change();

            // Re-add with nullOnDelete: when the user account is deleted,
            // the member record is preserved (audit trail) but user_id becomes null.
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contract_members', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->string('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};

