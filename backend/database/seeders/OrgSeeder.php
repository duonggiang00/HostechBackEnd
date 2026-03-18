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
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'full_name' => 'System Administrator',
                'password_hash' => \Illuminate\Support\Facades\Hash::make('12345678'),
                'org_id' => null,
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $admin->assignRole('Admin');
        $this->command->line("✅ System Admin: admin@example.com (Mật khẩu: 12345678)\n");

        $orgNames = [
            'Mường Thanh',
            'Nam Thanh',
            'Thăng Long',
            'Ngọc Ánh',
            'Titanic',
            'Love Street Hotel',
        ];
        $orgCount = count($orgNames);
        $usersPerOrg = 15;
        $propertiesPerOrg = 5;
        $floorsPerProperty = 4;
        $roomsPerFloor = 5;
        $roomsWithoutFloor = 3;

        $this->command->info('📍 Tạo tổ chức (Organizations)...');
        $this->command->line("└─ Số lượng tổ chức: <fg=cyan>$orgCount</>");

        foreach ($orgNames as $name) {
            $org = Org::factory()->create(['name' => $name]);
            // Create staff users for this org (Owners, Managers, Staff)
            $usersPerOrg = 10;
            $this->command->info("\n👥 Tạo đội ngũ quản lý cho tổ chức: <fg=yellow>{$org->name}</>");
            $this->command->line("└─ Số lượng: <fg=cyan>$usersPerOrg</>");

            for ($index = 0; $index < $usersPerOrg; $index++) {
                $orgSlug = Str::slug($org->name);
                $email = "";
                $role = "";

                if ($index < 2) {
                    $role = 'Owner';
                    $email = "{$orgSlug}_owner_" . ($index + 1) . "@example.com";
                } elseif ($index < 5) {
                    $role = 'Manager';
                    $email = "{$orgSlug}_manager_" . ($index - 1) . "@example.com";
                } else {
                    $role = 'Staff';
                    $email = "{$orgSlug}_staff_" . ($index - 4) . "@example.com";
                }

                $user = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'org_id' => $org->id,
                        'full_name' => fake()->name(),
                        'password_hash' => \Illuminate\Support\Facades\Hash::make('12345678'),
                        'email_verified_at' => now(),
                        'is_active' => true,
                    ]
                );
                $user->syncRoles([$role]);
            }

            // ---------------------------------------------------------
            // 2. CREATE SERVICES FOR THIS ORG
            // ---------------------------------------------------------
            $this->command->info("\n🔧 Tạo Dịch vụ cơ bản cho tổ chức...");
            $serviceDataList = [
                ['code' => 'DIEN', 'name' => 'Tiền điện', 'calc_mode' => 'PER_METER', 'unit' => 'kwh', 'price' => 4000],
                ['code' => 'NUOC', 'name' => 'Tiền nước', 'calc_mode' => 'PER_METER', 'unit' => 'm3', 'price' => 30000],
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
                        ['tier_from' => 0, 'tier_to' => null, 'price' => 4000],
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
                ->sequence(fn ($sequence) => ['area' => fake()->randomFloat(2, 95, 500)])
                ->create()
                ->each(function (Property $property, $index) use ($org, $floorsPerProperty, $roomsPerFloor, $roomsWithoutFloor, $serviceIds) {
                    // Get all managers and staff for this org
                    $managers = User::where('org_id', $org->id)->role('Manager')->get();
                    $staffs = User::where('org_id', $org->id)->role('Staff')->get();

                    // Assign 1 Manager and 2 Staff per property (round-robin if needed)
                    // If we have 3 managers and 5 properties, some managers will have 2 buildings.
                    $manager = $managers[$index % $managers->count()];
                    $staff1 = $staffs[($index * 2) % $staffs->count()];
                    $staff2 = $staffs[($index * 2 + 1) % $staffs->count()];
                    
                    if ($manager) $property->managers()->attach($manager->id);
                    if ($staff1) $property->managers()->attach($staff1->id);
                    if ($staff2) $property->managers()->attach($staff2->id);

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

                        // Ensure sum of room areas <= property area
                        // Usable area for rooms is e.g. 80% of property area
                        $usableArea = $property->area * 0.8;
                        $averageRoomArea = $usableArea / $roomsPerFloor;

                        for ($j = 0; $j < $roomsPerFloor; $j++) {
                            Room::factory()->create([
                                'org_id' => $org->id,
                                'property_id' => $property->id,
                                'floor_id' => $floor->id,
                                'area' => round($averageRoomArea * (rand(8, 12) / 10), 2),
                                'floor_number' => $i,
                            ]);
                        }
                    }

                    // Create rooms without floor
                    $this->command->line("     • Không có tầng - Tạo <fg=cyan>$roomsWithoutFloor</> phòng");
                    for ($j = 0; $j < $roomsWithoutFloor; $j++) {
                        Room::factory()->create([
                            'org_id' => $org->id,
                            'property_id' => $property->id,
                            'floor_id' => null,
                            'area' => fake()->randomFloat(2, 20, 50),
                            'floor_number' => 0,
                        ]);
                    }

                    $this->command->line("     ✅ Tổng cộng <fg=green>$totalRoomsInProperty</> phòng");

                    // CREATE MASTER METERS
                    $this->command->line("     📡 Tạo đồng hồ tổng cho tòa nhà...");
                    $masterMeterConfigs = [
                        ['type' => 'ELECTRIC', 'prefix' => 'M-E-', 'service_code' => 'DIEN'],
                        ['type' => 'WATER', 'prefix' => 'M-W-', 'service_code' => 'NUOC'],
                    ];

                    foreach ($masterMeterConfigs as $mConfig) {
                        DB::table('meters')->insert([
                            'id' => Str::uuid()->toString(),
                            'org_id' => $org->id,
                            'property_id' => $property->id,
                            'room_id' => null,
                            'service_id' => $serviceIds[$mConfig['service_code']],
                            'code' => $mConfig['prefix'] . $property->code,
                            'type' => $mConfig['type'],
                            'is_master' => true,
                            'installed_at' => '2025-01-01',
                            'is_active' => true,
                            'created_at' => '2025-01-01',
                            'updated_at' => '2025-01-01',
                        ]);
                    }
                });

            // ---------------------------------------------------------
            // 3. ASSIGN ROOM SERVICES, CONTRACTS, INVOICES
            // ---------------------------------------------------------
            $properties = Property::where('org_id', $org->id)->get();
            $baseCodes = ['DIEN', 'NUOC', 'INTERNET', 'QL', 'VS'];
            $ownerId = User::where('org_id', $org->id)->first()->id;

            foreach ($properties as $property) {
                $roomsInProperty = Room::where('property_id', $property->id)->get();
                $occupancyRate = rand(50, 80) / 100;
                $numOccupiedRooms = round($roomsInProperty->count() * $occupancyRate);
                $occupiedRoomIds = $roomsInProperty->random($numOccupiedRooms)->pluck('id')->toArray();

                foreach ($roomsInProperty as $room) {
                    // A. Assign Room Services & Meters (Ensure every room has meters)
                    $propertyStaffId = DB::table('property_user')
                        ->join('model_has_roles', 'property_user.user_id', '=', 'model_has_roles.model_id')
                        ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                        ->where('property_user.property_id', $room->property_id)
                        ->where('roles.name', 'Staff')
                        ->where('model_has_roles.model_type', User::class)
                        ->value('property_user.user_id') ?? $ownerId;

                    $meters = [];
                    $meterConfigs = [
                        ['type' => 'ELECTRIC', 'prefix' => 'E-', 'min' => 100, 'max' => 200, 'step' => 100],
                        ['type' => 'WATER', 'prefix' => 'W-', 'min' => 10, 'max' => 20, 'step' => 10],
                    ];

                    foreach ($meterConfigs as $mConfig) {
                        $meterId = Str::uuid()->toString();
                        DB::table('meters')->insert([
                            'id' => $meterId,
                            'org_id' => $org->id,
                            'property_id' => $room->property_id,
                            'room_id' => $room->id,
                            'service_id' => $serviceIds[$mConfig['type'] === 'ELECTRIC' ? 'DIEN' : 'NUOC'],
                            'code' => $mConfig['prefix'] . $room->code . '-' . rand(10, 99),
                            'type' => $mConfig['type'],
                            'is_master' => false,
                            'installed_at' => '2025-01-01',
                            'is_active' => true,
                            'created_at' => '2025-01-01',
                            'updated_at' => '2025-01-01',
                        ]);
                        $meters[] = ['id' => $meterId, 'config' => $mConfig, 'last_value' => rand(10, 100)];
                    }

                    $mandatoryCodes = ['DIEN', 'NUOC'];
                    $otherCodes = ['INTERNET', 'QL', 'VS'];
                    $selectedCodes = array_merge($mandatoryCodes, fake()->randomElements($otherCodes, fake()->numberBetween(1, 3)));
                    foreach ($selectedCodes as $code) {
                        DB::table('room_services')->insert([
                            'id' => Str::uuid()->toString(),
                            'org_id' => $org->id,
                            'room_id' => $room->id,
                            'service_id' => $serviceIds[$code],
                            'quantity' => 1,
                            'included_units' => ($code === 'INTERNET') ? 1 : 0,
                            'created_at' => '2025-01-01',
                            'updated_at' => '2025-01-01',
                        ]);
                    }

                    // B. Sequential Contracts
                    $currentDate = Carbon::parse('2025-01-01');
                    $cutoffDate = Carbon::parse('2026-03-31');
                    $numEndedContracts = rand(1, 2);
                    $isActiveRoom = in_array($room->id, $occupiedRoomIds);

                    // 1. Ended Contracts
                    for ($k = 0; $k < $numEndedContracts; $k++) {
                        if ($currentDate->gt($cutoffDate->copy()->subMonths(6))) break;

                        $duration = rand(3, 6);
                        $endDate = $currentDate->copy()->addMonths($duration);
                        
                        $this->createContractWithInvoices(
                            $org, $room, $ownerId, $currentDate, $endDate, 'ENDED', $meters, $propertyStaffId
                        );

                        $currentDate = $endDate->copy()->addMonths(1)->startOfMonth();
                    }

                    // 2. Active Contract
                    if ($isActiveRoom && $currentDate->lt($cutoffDate)) {
                        $this->createContractWithInvoices(
                            $org, $room, $ownerId, $currentDate, $currentDate->copy()->addMonths(12)->endOfMonth(), 'ACTIVE', $meters, $propertyStaffId
                        );
                        $room->update(['status' => 'occupied']);
                    } else {
                        $room->update(['status' => 'draft']);
                    }
                }
            }
        }

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

    private function createContractWithInvoices($org, $room, $ownerId, $startDate, $endDate, $status, &$meters, $staffId)
{
    $cutoffLimit = Carbon::parse('2026-03-31');
    
    // Calculate fixed services fee (non-metered services)
    $roomServiceIds = DB::table('room_services')->where('room_id', $room->id)->pluck('service_id');
    $fixedServicesFee = DB::table('services')
        ->join('service_rates', 'services.id', '=', 'service_rates.service_id')
        ->whereIn('services.id', $roomServiceIds)
        ->where('services.calc_mode', '!=', 'PER_METER')
        ->sum('service_rates.price');

    $baseRent = $room->base_price ?: 5000000;
    
    $contract = Contract::factory()->create([
        'org_id' => $room->org_id,
        'property_id' => $room->property_id,
        'room_id' => $room->id,
        'status' => $status,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'terminated_at' => $status === 'ENDED' ? $endDate : null,
        'created_by_user_id' => $ownerId,
        'rent_price' => $baseRent, // Keep for backward compatibility if needed
        'base_rent' => $baseRent,
        'fixed_services_fee' => $fixedServicesFee,
        'total_rent' => $baseRent + $fixedServicesFee,
        'cycle_months' => $startDate->diffInMonths($endDate) ?: 6,
    ]);

    $numMembers = rand(2, 3);
    for ($i = 0; $i < $numMembers; $i++) {
        // Dynamically create a tenant user for each contract member
        $fullName = fake('vi_VN')->name();
        $email = Str::slug($fullName) . '.' . Str::random(5) . '@tenant.hostech.vn';
        
        $memberUser = User::create([
            'id' => Str::uuid()->toString(),
            'org_id' => $org->id,
            'full_name' => $fullName,
            'email' => $email,
            'password_hash' => \Illuminate\Support\Facades\Hash::make('12345678'),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $memberUser->assignRole('Tenant');

        ContractMember::create([
            'id' => Str::uuid()->toString(),
            'org_id' => $contract->org_id,
            'contract_id' => $contract->id,
            'user_id' => $memberUser->id,
            'full_name' => $fullName,
            'role' => $i === 0 ? 'TENANT' : 'ROOMMATE',
            'is_primary' => $i === 0,
            'left_at' => $status === 'ENDED' ? $endDate : null,
        ]);
    }

    // --- Invoicing Logic ---
    $tempDate = $startDate->copy();
    $isFirstInvoice = true;

    while ($tempDate->lte($endDate) && $tempDate->lte($cutoffLimit)) {
        $invoiceDate = $tempDate->copy()->addDays(rand(0, 5));
        if ($invoiceDate->gt($cutoffLimit)) break;

        $invoice = Invoice::create([
            'id' => Str::uuid()->toString(),
            'org_id' => $org->id,
            'property_id' => $room->property_id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'status' => ($status === 'ENDED' || $tempDate->lt(now()->subMonth())) ? 'PAID' : 'PENDING',
            'issue_date' => $invoiceDate,
            'due_date' => $invoiceDate->copy()->addDays(7),
            'period_start' => $tempDate->copy()->startOfMonth(),
            'period_end' => $tempDate->copy()->endOfMonth(),
            'total_amount' => 0,
            'paid_amount' => 0,
            'created_by_user_id' => $ownerId,
        ]);
        if ($isFirstInvoice) {
            // First Invoice: Rent + Deposit
            InvoiceItem::create([
                'id' => Str::uuid()->toString(),
                'org_id' => $org->id,
                'invoice_id' => $invoice->id,
                'description' => 'Tiền đặt cọc',
                'amount' => $contract->deposit_amount,
                'unit_price' => $contract->deposit_amount,
                'quantity' => 1,
                'type' => 'DEPOSIT',
            ]);
            InvoiceItem::create([
                'id' => Str::uuid()->toString(),
                'org_id' => $org->id,
                'invoice_id' => $invoice->id,
                'description' => 'Tiền phòng tháng đầu',
                'amount' => $contract->total_rent,
                'unit_price' => $contract->total_rent,
                'quantity' => 1,
                'type' => 'RENT',
            ]);
            $isFirstInvoice = false;
            // No addMonth here because utility readings happen at the end of the same month
        }

        if (!$isFirstInvoice && $tempDate->gt($startDate)) {
             InvoiceItem::create([
                'id' => Str::uuid()->toString(),
                'org_id' => $org->id,
                'invoice_id' => $invoice->id,
                'description' => 'Tiền phòng',
                'amount' => $contract->total_rent,
                'unit_price' => $contract->total_rent,
                'quantity' => 1,
                'type' => 'RENT',
            ]);
        }

        // End of month: Utilities (DIEN, NUOC)
        foreach ($meters as &$m) {
            $pStart = $tempDate->copy()->startOfMonth();
            $pEnd = $tempDate->copy()->endOfMonth();
            $usage = rand($m['config']['min'], $m['config']['max']);
            $newValue = $m['last_value'] + $usage;
            $readingId = Str::uuid()->toString();

            DB::table('meter_readings')->updateOrInsert(
                [
                    'org_id' => $org->id,
                    'meter_id' => $m['id'],
                    'period_start' => $pStart->toDateString(),
                    'period_end' => $pEnd->toDateString(),
                ],
                [
                    'id' => $readingId,
                    'reading_value' => $newValue,
                    'status' => 'LOCKED',
                    'submitted_by_user_id' => $staffId,
                    'submitted_at' => $pEnd->copy()->addDay(),
                    'created_at' => $pEnd,
                    'updated_at' => $pEnd,
                ]
            );

            InvoiceItem::create([
                'id' => Str::uuid()->toString(),
                'org_id' => $org->id,
                'invoice_id' => $invoice->id,
                'description' => 'Tiền ' . $m['config']['type'],
                'amount' => $usage * ($m['config']['type'] === 'ELECTRIC' ? 4000 : 30000),
                'unit_price' => ($m['config']['type'] === 'ELECTRIC' ? 4000 : 30000),
                'quantity' => $usage,
                'type' => 'SERVICE',
            ]);

            $m['last_value'] = $newValue;
        }

        $total = DB::table('invoice_items')->where('invoice_id', $invoice->id)->sum('amount');
        $invoice->update([
            'total_amount' => $total,
            'paid_amount' => $invoice->status === 'PAID' ? $total : 0
        ]);

        $tempDate->addMonths(1);
    }

    return $contract;
}
}
