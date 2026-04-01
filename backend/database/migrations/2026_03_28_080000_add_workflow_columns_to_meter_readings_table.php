<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meter_readings', function (Blueprint $table) {
            $table->foreignUuid('rejected_by_user_id')->nullable()->after('approved_at')
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable()->after('rejected_by_user_id');
            $table->text('rejection_reason')->nullable()->after('rejected_at');
        });

        // Migrate existing PENDING → SUBMITTED
        DB::table('meter_readings')->where('status', 'PENDING')->update(['status' => 'SUBMITTED']);
    }

    public function down(): void
    {
        // Revert SUBMITTED back to PENDING
        DB::table('meter_readings')->where('status', 'SUBMITTED')->update(['status' => 'PENDING']);

        Schema::table('meter_readings', function (Blueprint $table) {
            $table->dropForeign(['rejected_by_user_id']);
            $table->dropColumn(['rejected_by_user_id', 'rejected_at', 'rejection_reason']);
        });
    }
};
