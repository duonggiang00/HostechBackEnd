<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Thêm cột email vào contract_members như một phần của snapshot identity.
 *
 * contract_members đã lưu full_name, phone, identity_number làm snapshot.
 * email cũng là identity data — không có lý do gì để strip nó.
 *
 * Với email trong bảng:
 *   - user_id=NULL + email="x@y.com" + status=PENDING_INVITE
 *     → đủ để backfill user_id khi tenant đăng ký qua link mời.
 *   - Không cần invitation_id FK, không cần invite_email riêng, không cần lookup phụ.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_members', function (Blueprint $table) {
            $table->string('email')->nullable()->after('user_id');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::table('contract_members', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropColumn('email');
        });
    }
};
