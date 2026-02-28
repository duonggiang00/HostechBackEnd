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
        Schema::create('handovers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id')->index();
            $table->uuid('contract_id')->index();
            $table->uuid('room_id')->index();
            
            $table->string('type', 10); // ENUM: CHECKIN, CHECKOUT
            $table->string('status', 10)->default('DRAFT'); // ENUM: DRAFT, CONFIRMED
            $table->text('note')->nullable();
            
            $table->uuid('confirmed_by_user_id')->nullable()->index();
            
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('locked_at')->nullable(); // Khóa không cho sửa sau confirm
            
            $table->timestamps();

            // Khóa ngoại
            $table->foreign('org_id')->references('id')->on('orgs')->onDelete('cascade');
            $table->foreign('contract_id')->references('id')->on('contracts')->onDelete('cascade');
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->foreign('confirmed_by_user_id')->references('id')->on('users')->onDelete('set null');

            $table->unique(['contract_id', 'type']);
        });

        Schema::create('handover_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id')->index();
            $table->uuid('handover_id')->index();
            
            // Link sang tài sản phòng (Tùy chọn)
            $table->uuid('room_asset_id')->nullable()->index();
            
            $table->string('name');
            $table->string('status', 10)->default('OK'); // ENUM: OK, MISSING, DAMAGED
            $table->text('note')->nullable();
            $table->integer('sort_order')->default(0);
            
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable()->useCurrentOnUpdate();

            // Khóa ngoại
            $table->foreign('org_id')->references('id')->on('orgs')->onDelete('cascade');
            $table->foreign('handover_id')->references('id')->on('handovers')->onDelete('cascade');
            $table->foreign('room_asset_id')->references('id')->on('room_assets')->onDelete('set null');
        });

        Schema::create('handover_meter_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('org_id')->index();
            $table->uuid('handover_id')->index();
            $table->uuid('meter_id')->index();
            
            $table->bigInteger('reading_value');

            $table->timestamps();

            // Khóa ngoại
            $table->foreign('org_id')->references('id')->on('orgs')->onDelete('cascade');
            $table->foreign('handover_id')->references('id')->on('handovers')->onDelete('cascade');
            $table->foreign('meter_id')->references('id')->on('meters')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('handover_meter_snapshots');
        Schema::dropIfExists('handover_items');
        Schema::dropIfExists('handovers');
    }
};
