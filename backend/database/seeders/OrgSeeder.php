<?php

namespace Database\Seeders;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Handover\Handover;
use App\Models\Handover\HandoverItem;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use App\Models\Property\RoomPrice;
use App\Models\Service\Service;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrgSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info("\n================================");
        $this->command->info('📊 BẮT ĐẦU SEED DỮ LIỆU');
        $this->command->info("================================\n");

        // Create system-wide Admin (Single System Administrator)
        $this->command->info('👤 Tạo tài khoản Administrator toàn quyền hệ thống...');
        User::factory()->admin()->create([
            'password_hash' => \Illuminate\Support\Facades\Hash::make('12345678'),
            'org_id' => null,
        ]);
        $this->command->line("✅ System Admin: admin@example.com (Mật khẩu: 12345678)\n");

        $orgCount = 3;
        $usersPerOrg = 5;
        $propertiesPerOrg = 2;
        $floorsPerProperty = 4;
        $roomsPerFloor = 5;
        $roomsWithoutFloor = 3;

        $this->command->info('📍 Tạo tổ chức (Organizations)...');
        $this->command->line("└─ Số lượng tổ chức: <fg=cyan>$orgCount</>");

        Org::factory($orgCount)->create()->each(function (Org $org) use ($usersPerOrg, $propertiesPerOrg, $floorsPerProperty, $roomsPerFloor, $roomsWithoutFloor) {
            // Create users for this org
            $this->command->info("\n👥 Tạo người dùng cho tổ chức: <fg=yellow>{$org->name}</>");
            $this->command->line("└─ Số lượng người dùng: <fg=cyan>$usersPerOrg</>");

            // Note: We no longer create "Admin" per org. Roles start from Owner.
            // Adjust usersPerOrg logic if exact number needed, but usually factory count is just total.

            User::factory($usersPerOrg)
                ->state(['org_id' => $org->id])
                ->create()
                ->each(function (User $user, $index) use ($org) {
                    $orgSlug = Str::slug($org->name);
                    // Assign roles based on user index
                    if ($index === 0) {
                        $user->assignRole('Owner');
                        $user->update(['email' => "{$orgSlug}_owner@example.com"]);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=magenta>Owner</>");
                    } elseif ($index === 1) {
                        $user->assignRole('Manager');
                        $user->update(['email' => "{$orgSlug}_manager@example.com"]);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=blue>Manager</>");
                    } elseif ($index === 2) {
                        $user->assignRole('Staff');
                        $user->update(['email' => "{$orgSlug}_staff@example.com"]);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=green>Staff</>");
                    } else {
                        $user->assignRole('Tenant');
                        // Use unique string for tenants since there are multiple
                        $uniqueStr = Str::random(4);
                        $user->update(['email' => "{$orgSlug}_tenant_{$uniqueStr}@example.com"]);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=cyan>Tenant</>");
                    }
                });

            // ---------------------------------------------------------
            // 2. CREATE SERVICES FOR THIS ORG
            // ---------------------------------------------------------
            $this->command->info("\n🔧 Tạo Dịch vụ cơ bản cho tổ chức...");
            $serviceDataList = [
                ['code' => 'DIEN', 'name' => 'Tiền điện', 'calc_mode' => 'PER_METER', 'unit' => 'kwh', 'price' => 3500],
                ['code' => 'NUOC', 'name' => 'Tiền nước', 'calc_mode' => 'PER_METER', 'unit' => 'm3', 'price' => 15000],
                ['code' => 'INTERNET', 'name' => 'Internet', 'calc_mode' => 'PER_ROOM', 'unit' => 'month', 'price' => 100000],
                ['code' => 'QL', 'name' => 'Phí quản lý', 'calc_mode' => 'PER_ROOM', 'unit' => 'month', 'price' => 50000],
                ['code' => 'GUIXE', 'name' => 'Gửi xe máy', 'calc_mode' => 'PER_QUANTITY', 'unit' => 'bike', 'price' => 100000],
                ['code' => 'VS', 'name' => 'Vệ sinh', 'calc_mode' => 'PER_ROOM', 'unit' => 'month', 'price' => 30000],
            ];

            $serviceIds = [];
            foreach ($serviceDataList as $data) {
                $price = $data['price'];
                unset($data['price']);

                $data['id'] = Str::uuid()->toString();
                $data['org_id'] = $org->id;
                $data['is_active'] = true;
                $data['is_recurring'] = true;
                $data['created_at'] = now();
                $data['updated_at'] = now();

                DB::table('services')->insert($data);
                $serviceId = $data['id'];
                $serviceIds[$data['code']] = $serviceId;

                $rateId = Str::uuid()->toString();
                DB::table('service_rates')->insert([
                    'id' => $rateId,
                    'org_id' => $org->id,
                    'service_id' => $serviceId,
                    'effective_from' => now()->startOfMonth()->toDateString(),
                    'price' => $price,
                    'created_at' => now(),
                ]);

                if ($data['code'] === 'DIEN') {
                    $tiers = [
                        ['tier_from' => 0, 'tier_to' => 50, 'price' => 2000],
                        ['tier_from' => 51, 'tier_to' => 100, 'price' => 2500],
                        ['tier_from' => 101, 'tier_to' => 200, 'price' => 3000],
                        ['tier_from' => 201, 'tier_to' => null, 'price' => 3500],
                    ];
                    foreach ($tiers as $tier) {
                        DB::table('tiered_rates')->insert([
                            'id' => Str::uuid()->toString(),
                            'org_id' => $org->id,
                            'service_rate_id' => $rateId,
                            'tier_from' => $tier['tier_from'],
                            'tier_to' => $tier['tier_to'],
                            'price' => $tier['price'],
                        ]);
                    }
                }
            }

            // Create properties
            $this->command->info("\n🏢 Tạo bất động sản (Properties)...");
            $this->command->line("└─ Số lượng bất động sản: <fg=cyan>$propertiesPerOrg</>");

            Property::factory($propertiesPerOrg)
                ->state(['org_id' => $org->id])
                ->create()
                ->each(function (Property $property) use ($org, $floorsPerProperty, $roomsPerFloor, $roomsWithoutFloor) {
                    $this->command->info("\n  📐 Bất động sản: <fg=yellow>{$property->name}</> (Mã: {$property->code})");

                    // Create floors
                    $this->command->line("  └─ Tạo tầng: <fg=cyan>$floorsPerProperty</>");

                    $totalRoomsInProperty = ($floorsPerProperty * $roomsPerFloor) + $roomsWithoutFloor;

                    for ($i = 1; $i <= $floorsPerProperty; $i++) {
                        $floor = Floor::factory()->create([
                            'org_id' => $org->id,
                            'property_id' => $property->id,
                            'name' => "Tầng $i",
                            'code' => 'F'.str_pad($i, 2, '0', STR_PAD_LEFT),
                            'sort_order' => $i,
                        ]);

                        $this->command->line("     • {$floor->name} - Tạo <fg=cyan>$roomsPerFloor</> phòng");

                        Room::factory($roomsPerFloor)
                            ->state(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id])
                            ->create();
                    }

                    // Create rooms without floor
                    $this->command->line("     • Không có tầng - Tạo <fg=cyan>$roomsWithoutFloor</> phòng");
                    Room::factory($roomsWithoutFloor)
                        ->state(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => null])
                        ->create();

                    $this->command->line("     ✅ Tổng cộng <fg=green>$totalRoomsInProperty</> phòng");
                });

            // ---------------------------------------------------------
            // 3. ASSIGN ROOM SERVICES, CONTRACTS, INVOICES
            // ---------------------------------------------------------
            $rooms = Room::where('org_id', $org->id)->get();
            $baseCodes = ['DIEN', 'NUOC', 'INTERNET', 'QL', 'VS'];
            $ownerId = User::where('org_id', $org->id)->first()->id;

            foreach ($rooms as $room) {
                // A. Assign Room Services
                $selectedCodes = fake()->randomElements($baseCodes, fake()->numberBetween(3, 5));
                foreach ($selectedCodes as $code) {
                    DB::table('room_services')->insert([
                        'id' => Str::uuid()->toString(),
                        'org_id' => $org->id,
                        'room_id' => $room->id,
                        'service_id' => $serviceIds[$code],
                        'quantity' => 1,
                        'included_units' => ($code === 'INTERNET') ? 1 : 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                if (fake()->boolean(60) && isset($serviceIds['GUIXE'])) {
                    DB::table('room_services')->insert([
                        'id' => Str::uuid()->toString(),
                        'org_id' => $org->id,
                        'room_id' => $room->id,
                        'service_id' => $serviceIds['GUIXE'],
                        'quantity' => fake()->numberBetween(1, 3),
                        'included_units' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // B. Manage Contracts & Invoices
                if (rand(0, 100) > 30) {
                    // Active Contract
                    $contract = Contract::factory()->create([
                        'org_id' => $room->org_id,
                        'property_id' => $room->property_id,
                        'room_id' => $room->id,
                        'status' => 'ACTIVE',
                        'start_date' => now()->subMonths(rand(1, 11)),
                        'end_date' => now()->addMonths(rand(1, 12)),
                        'created_by_user_id' => $ownerId,
                    ]);

                    ContractMember::factory()->create([
                        'org_id' => $contract->org_id,
                        'contract_id' => $contract->id,
                        'role' => 'TENANT',
                        'is_primary' => true,
                    ]);

                    if (rand(0, 1) === 1) {
                        ContractMember::factory()->create([
                            'org_id' => $contract->org_id,
                            'contract_id' => $contract->id,
                            'role' => 'ROOMMATE',
                            'is_primary' => false,
                        ]);
                    }

                    // Generate Invoices for this Active Contract
                    $servicesToInvoice = Service::where('org_id', $org->id)->inRandomOrder()->limit(3)->get();

                    // Paid Invoice (Last month)
                    $lastMonthStart = Carbon::now()->subMonth()->startOfMonth();
                    $paidInvoice = Invoice::factory()->paid()->create([
                        'org_id' => $org->id,
                        'property_id' => $room->property_id,
                        'contract_id' => $contract->id,
                        'room_id' => $room->id,
                        'period_start' => $lastMonthStart->toDateString(),
                        'period_end' => $lastMonthStart->copy()->endOfMonth()->toDateString(),
                        'due_date' => $lastMonthStart->copy()->addDays(5)->toDateString(),
                        'total_amount' => 5500000,
                    ]);
                    InvoiceItem::factory()->rent()->create(['org_id' => $org->id, 'invoice_id' => $paidInvoice->id, 'unit_price' => 5000000, 'amount' => 5000000]);
                    foreach ($servicesToInvoice as $svc) {
                        InvoiceItem::factory()->create(['org_id' => $org->id, 'invoice_id' => $paidInvoice->id, 'service_id' => $svc->id, 'description' => 'Tiền '.$svc->name, 'unit_price' => $svc->unit_price ?? 50000, 'quantity' => rand(1, 10)]);
                    }
                    $paidInvoice->update(['total_amount' => $paidInvoice->items()->sum('amount'), 'paid_amount' => $paidInvoice->items()->sum('amount')]);

                    // Seed Invoice History for Paid Invoice
                    DB::table('invoice_status_histories')->insert([
                        'id' => Str::uuid()->toString(),
                        'org_id' => $org->id,
                        'invoice_id' => $paidInvoice->id,
                        'from_status' => 'PENDING',
                        'to_status' => 'PAID',
                        'note' => 'Thanh toán đủ bằng tiền mặt',
                        'changed_by_user_id' => $ownerId,
                        'created_at' => now(),
                    ]);

                    // Seed an Invoice Adjustment (Ví dụ giảm một khoản nhỏ)
                    DB::table('invoice_adjustments')->insert([
                        'id' => Str::uuid()->toString(),
                        'org_id' => $org->id,
                        'invoice_id' => $paidInvoice->id,
                        'type' => 'CREDIT',
                        'amount' => 50000,
                        'reason' => 'Giảm trừ 50k do khách phản ánh nước yếu',
                        'created_by_user_id' => $ownerId,
                        'approved_by_user_id' => $ownerId,
                        'approved_at' => now(),
                        'created_at' => now(),
                    ]);

                    // Pending Invoice (This month)
                    $thisMonthStart = Carbon::now()->startOfMonth();
                    $pendingInvoice = Invoice::factory()->issued()->create([
                        'org_id' => $org->id,
                        'property_id' => $room->property_id,
                        'contract_id' => $contract->id,
                        'room_id' => $room->id,
                        'period_start' => $thisMonthStart->toDateString(),
                        'period_end' => $thisMonthStart->copy()->endOfMonth()->toDateString(),
                        'due_date' => $thisMonthStart->copy()->addDays(5)->toDateString(),
                        'status' => 'PENDING',
                        'total_amount' => 5500000,
                        'paid_amount' => 0,
                    ]);
                    InvoiceItem::factory()->rent()->create(['org_id' => $org->id, 'invoice_id' => $pendingInvoice->id, 'unit_price' => 5000000, 'amount' => 5000000]);
                    $pendingInvoice->update(['total_amount' => $pendingInvoice->items()->sum('amount')]);

                    // Seed Invoice History for Pending Invoice
                    DB::table('invoice_status_histories')->insert([
                        'id' => Str::uuid()->toString(),
                        'org_id' => $org->id,
                        'invoice_id' => $pendingInvoice->id,
                        'from_status' => 'DRAFT',
                        'to_status' => 'PENDING',
                        'note' => 'Xuất hóa đơn tháng này',
                        'changed_by_user_id' => $ownerId,
                        'created_at' => now(),
                    ]);

                    // Mock a Meter, Meter Reading and Adjustment Note for this room
                    $meterId = Str::uuid()->toString();
                    DB::table('meters')->insert([
                        'id' => $meterId,
                        'org_id' => $org->id,
                        'room_id' => $room->id,
                        'code' => 'METER_E_'.rand(1000, 9999),
                        'type' => 'ELECTRIC',
                        'installed_at' => now()->subYear()->toDateString(),
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $readingId = Str::uuid()->toString();
                    DB::table('meter_readings')->insert([
                        'id' => $readingId,
                        'org_id' => $org->id,
                        'meter_id' => $meterId,
                        'period_start' => $thisMonthStart->toDateString(),
                        'period_end' => $thisMonthStart->copy()->endOfMonth()->toDateString(),
                        'reading_value' => rand(150, 200),
                        'status' => 'LOCKED',
                        'submitted_by_user_id' => $ownerId,
                        'submitted_at' => now()->subDays(2),
                        'approved_by_user_id' => $ownerId,
                        'approved_at' => now()->subDays(1),
                        'locked_at' => now()->subDays(1),
                        'created_at' => now()->subDays(2),
                        'updated_at' => now()->subDays(1),
                    ]);

                    // Seed an Adjustment Note
                    DB::table('adjustment_notes')->insert([
                        'id' => Str::uuid()->toString(),
                        'org_id' => $org->id,
                        'meter_reading_id' => $readingId,
                        'reason' => 'Chủ nhà ghi nhầm công tơ điện tháng này',
                        'before_value' => 250,
                        'after_value' => 200, // Reduced to actual
                        'requested_by_user_id' => $ownerId,
                        'approved_by_user_id' => $ownerId,
                        'approved_at' => now(),
                        'created_at' => now(),
                    ]);

                    // Seed Handover (Checkin) cho hợp đồng Active
                    $handoverId = Str::uuid()->toString();
                    DB::table('handovers')->insert([
                        'id' => $handoverId,
                        'org_id' => $org->id,
                        'contract_id' => $contract->id,
                        'room_id' => $room->id,
                        'type' => 'CHECKIN',
                        'status' => 'CONFIRMED',
                        'note' => 'Bàn giao phòng cho khách thuê mới',
                        'confirmed_by_user_id' => $ownerId,
                        'confirmed_at' => $contract->start_date,
                        'locked_at' => $contract->start_date,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Seed Handover Meter Snapshot
                    DB::table('handover_meter_snapshots')->insert([
                        'id' => Str::uuid()->toString(),
                        'org_id' => $org->id,
                        'handover_id' => $handoverId,
                        'meter_id' => $meterId,
                        'reading_value' => rand(10, 50),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Seed 1 Asset (Ví dụ Điều Hòa) để test link tới HandoverItem
                    $assetId = Str::uuid()->toString();
                    DB::table('room_assets')->insert([
                        'id' => $assetId,
                        'org_id' => $org->id,
                        'room_id' => $room->id,
                        'name' => 'Điều hòa Panasonic 9000BTU',
                        'condition' => 'Tốt',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Seed Handover Items (1 linh hoạt + 1 link asset)
                    DB::table('handover_items')->insert([
                        ['id' => Str::uuid()->toString(), 'org_id' => $org->id, 'handover_id' => $handoverId, 'room_asset_id' => null, 'name' => '2 Chìa khóa cửa chính', 'status' => 'OK', 'sort_order' => 1, 'created_at' => now()],
                        ['id' => Str::uuid()->toString(), 'org_id' => $org->id, 'handover_id' => $handoverId, 'room_asset_id' => null, 'name' => '1 Thẻ từ thang máy', 'status' => 'OK', 'sort_order' => 2, 'created_at' => now()],
                        ['id' => Str::uuid()->toString(), 'org_id' => $org->id, 'handover_id' => $handoverId, 'room_asset_id' => $assetId, 'name' => 'Điều hòa Panasonic 9000BTU', 'status' => 'OK', 'sort_order' => 3, 'created_at' => now()],
                    ]);
                }

                if (rand(0, 100) > 70) {
                    // Ended Contract
                    $contract = Contract::factory()->create([
                        'org_id' => $room->org_id,
                        'property_id' => $room->property_id,
                        'room_id' => $room->id,
                        'status' => 'ENDED',
                        'start_date' => now()->subYears(2),
                        'end_date' => now()->subYears(1),
                        'terminated_at' => now()->subYears(1),
                        'created_by_user_id' => $ownerId,
                    ]);
                    ContractMember::factory()->create([
                        'org_id' => $contract->org_id,
                        'contract_id' => $contract->id,
                        'role' => 'TENANT',
                        'is_primary' => true,
                        'left_at' => $contract->end_date,
                    ]);
                }

                // C. Seed Tickets (40% chance per room to have a ticket)
                if (rand(0, 100) > 60) {
                    $ticketId = Str::uuid()->toString();
                    $tenantId = User::where('org_id', $org->id)->whereHas('roles', function ($q) {
                        $q->where('name', 'Tenant');
                    })->inRandomOrder()->first()?->id ?? $ownerId;

                    $isClosed = rand(0, 1) === 1;
                    $status = $isClosed ? 'DONE' : fake()->randomElement(['OPEN', 'RECEIVED', 'IN_PROGRESS', 'WAITING_PARTS']);
                    $createdAt = now()->subDays(rand(1, 15));

                    DB::table('tickets')->insert([
                        'id' => $ticketId,
                        'org_id' => $org->id,
                        'property_id' => $room->property_id,
                        'room_id' => $room->id,
                        'contract_id' => isset($contract) ? $contract->id : null,
                        'created_by_user_id' => $tenantId,
                        'assigned_to_user_id' => $ownerId,
                        'category' => fake()->randomElement(['Điện', 'Nước', 'Vệ sinh', 'Khác']),
                        'priority' => fake()->randomElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
                        'status' => $status,
                        'description' => fake()->sentence(8),
                        'due_at' => $createdAt->copy()->addDays(3),
                        'closed_at' => $isClosed ? $createdAt->copy()->addDays(rand(1, 2)) : null,
                        'created_at' => $createdAt,
                        'updated_at' => $isClosed ? $createdAt->copy()->addDays(rand(1, 2)) : $createdAt,
                    ]);

                    // Seed Ticket Events
                    DB::table('ticket_events')->insert([
                        'id' => Str::uuid()->toString(),
                        'org_id' => $org->id,
                        'ticket_id' => $ticketId,
                        'actor_user_id' => $tenantId,
                        'type' => 'CREATED',
                        'message' => 'Tạo phiếu yêu cầu mới',
                        'created_at' => $createdAt,
                    ]);

                    if ($status !== 'OPEN') {
                        DB::table('ticket_events')->insert([
                            'id' => Str::uuid()->toString(),
                            'org_id' => $org->id,
                            'ticket_id' => $ticketId,
                            'actor_user_id' => $ownerId,
                            'type' => 'STATUS_CHANGED',
                            'message' => 'Chuyển trạng thái sang '.$status,
                            'created_at' => $createdAt->copy()->addHours(2),
                        ]);
                    }

                    // 50% chance for ticket costs if it's DONE
                    if ($isClosed && rand(0, 1) === 1) {
                        DB::table('ticket_costs')->insert([
                            'id' => Str::uuid()->toString(),
                            'org_id' => $org->id,
                            'ticket_id' => $ticketId,
                            'amount' => fake()->randomElement([50000, 100000, 150000, 200000]),
                            'payer' => fake()->randomElement(['OWNER', 'TENANT']),
                            'note' => 'Chi phí sửa chữa/thay thế vật tư',
                            'created_by_user_id' => $ownerId,
                            'created_at' => $createdAt->copy()->addDays(1),
                        ]);
                    }
                }
            }
        });

        $this->command->info("\n================================");
        $this->command->info('📊 TỔNG HỢP DỮ LIỆU ĐÃ SEED');
        $this->command->info('================================');
        $this->command->line('✅ System Admin: <fg=cyan>1</> (admin@example.com 🔓)');
        $this->command->line("✅ Tổ chức: <fg=cyan>$orgCount</>");
        $this->command->line('✅ Tổng người dùng: <fg=cyan>'.($orgCount * $usersPerOrg).'</>');
        $this->command->line('✅ Bất động sản: <fg=cyan>'.($orgCount * $propertiesPerOrg).'</>');
        $this->command->line('✅ Tầng: <fg=cyan>'.($orgCount * $propertiesPerOrg * $floorsPerProperty).'</>');
        $this->command->line('✅ Phòng: <fg=cyan>'.($orgCount * $propertiesPerOrg * (($floorsPerProperty * $roomsPerFloor) + $roomsWithoutFloor)).'</>');

        // Cập nhật số lượng dữ liệu chi tiết phòng (được sinh ngẫu nhiên)
        $this->command->line('✅ Tài sản phòng (Assets): <fg=cyan>'.RoomAsset::count().'</>');
        $this->command->line('✅ Lịch sử giá (Prices): <fg=cyan>'.RoomPrice::count().'</>');
        $this->command->line('✅ Dịch vụ (Services): <fg=cyan>'.Service::count().'</>');
        $this->command->line('✅ Hợp đồng (Contracts): <fg=cyan>'.Contract::count().'</>');
        $this->command->line('✅ Hóa đơn (Invoices): <fg=cyan>'.Invoice::count().'</>');
        $this->command->line('✅ Sự cố/Yêu cầu (Tickets): <fg=cyan>'.DB::table('tickets')->count().'</>');
        $this->command->line('✅ Bàn giao (Handovers): <fg=cyan>'.Handover::count()."</>\n");
    }
}
