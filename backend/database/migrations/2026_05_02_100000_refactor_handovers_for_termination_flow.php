<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('handovers', function (Blueprint $table) {
            if (! Schema::hasColumn('handovers', 'created_by_user_id')) {
                $table->uuid('created_by_user_id')->nullable()->after('room_id');
                $table->foreign('created_by_user_id')->references('id')->on('users')->nullOnDelete();
            }
        });

        $hasConfirmedBy = Schema::hasColumn('handovers', 'confirmed_by_user_id');
        foreach (DB::table('handovers')->cursor() as $row) {
            $contract = DB::table('contracts')->where('id', $row->contract_id)->first();
            $resolved = $row->created_by_user_id ?? null;
            if ($resolved === null && $hasConfirmedBy && isset($row->confirmed_by_user_id)) {
                $resolved = $row->confirmed_by_user_id;
            }
            if ($resolved === null && $contract) {
                $resolved = $contract->created_by_user_id ?? null;
            }
            if ($resolved !== null) {
                DB::table('handovers')->where('id', $row->id)->update(['created_by_user_id' => $resolved]);
            }
        }

        if (Schema::hasColumn('handover_items', 'status') && ! Schema::hasColumn('handover_items', 'condition')) {
            Schema::table('handover_items', function (Blueprint $table) {
                $table->renameColumn('status', 'condition');
            });
        }

        if (Schema::hasColumn('handover_items', 'condition')) {
            DB::table('handover_items')->where('condition', 'GOOD')->update(['condition' => 'OK']);
        }

        Schema::table('handovers', function (Blueprint $table) {
            if (Schema::hasColumn('handovers', 'confirmed_by_user_id')) {
                try {
                    $table->dropForeign(['confirmed_by_user_id']);
                } catch (Throwable) {
                    // SQLite / legacy names
                }
            }
        });

        // Legacy: UNIQUE(contract_id, type) — phải gỡ trước khi drop cột `type` (MySQL).
        if (Schema::hasColumn('handovers', 'type')) {
            Schema::table('handovers', function (Blueprint $table) {
                try {
                    $table->dropUnique(['contract_id', 'type']);
                } catch (Throwable) {
                    // Tên index khác hoặc đã được gỡ
                }
            });
        }

        Schema::table('handovers', function (Blueprint $table) {
            $drops = [];
            foreach (['type', 'status', 'confirmed_at', 'locked_at', 'confirmed_by_user_id'] as $col) {
                if (Schema::hasColumn('handovers', $col)) {
                    $drops[] = $col;
                }
            }
            if ($drops !== []) {
                $table->dropColumn($drops);
            }
        });
    }

    public function down(): void
    {
        Schema::table('handovers', function (Blueprint $table) {
            if (! Schema::hasColumn('handovers', 'type')) {
                $table->string('type')->default('OUT')->after('room_id');
            }
            if (! Schema::hasColumn('handovers', 'status')) {
                $table->string('status')->default('DRAFT')->after('type');
            }
            if (! Schema::hasColumn('handovers', 'confirmed_at')) {
                $table->timestamp('confirmed_at')->nullable()->after('note');
            }
            if (! Schema::hasColumn('handovers', 'locked_at')) {
                $table->timestamp('locked_at')->nullable()->after('confirmed_at');
            }
            if (! Schema::hasColumn('handovers', 'confirmed_by_user_id')) {
                $table->uuid('confirmed_by_user_id')->nullable()->after('locked_at');
                $table->foreign('confirmed_by_user_id')->references('id')->on('users')->nullOnDelete();
            }
        });

        if (Schema::hasColumn('handovers', 'type')) {
            Schema::table('handovers', function (Blueprint $table) {
                try {
                    $table->unique(['contract_id', 'type'], 'handovers_contract_id_type_unique');
                } catch (Throwable) {
                    // Trùng (contract_id, type) sau khi rollback hoặc index đã tồn tại
                }
            });
        }

        if (Schema::hasColumn('handover_items', 'condition') && ! Schema::hasColumn('handover_items', 'status')) {
            Schema::table('handover_items', function (Blueprint $table) {
                $table->renameColumn('condition', 'status');
            });
        }

        Schema::table('handovers', function (Blueprint $table) {
            if (Schema::hasColumn('handovers', 'created_by_user_id')) {
                try {
                    $table->dropForeign(['created_by_user_id']);
                } catch (Throwable) {
                }
                $table->dropColumn('created_by_user_id');
            }
        });
    }
};
