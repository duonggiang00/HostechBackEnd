<?php

namespace Database\Seeders;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Handover\Handover;
use App\Models\Handover\HandoverItem;
use App\Models\Handover\HandoverMeterSnapshot;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use App\Models\Property\RoomPrice;
use App\Models\Property\RoomTemplate;
use App\Models\Service\Service;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Services\Meter\MeterReadingService;
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
        $usersPerOrg = 10;
        $propertiesPerOrg = rand(2, 3);
        $floorsPerProperty = rand(3, 4);

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
                ['code' => 'DIEN_BT', 'name' => 'Điện bậc thang', 'calc_mode' => 'PER_METER', 'unit' => 'kwh', 'price' => 1984],
                ['code' => 'NUOC_BT', 'name' => 'Nước bậc thang', 'calc_mode' => 'PER_METER', 'unit' => 'm3', 'price' => 5973],
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

                if ($data['code'] === 'DIEN_BT') {
                    $tiers = [
                        ['tier_from' => 0, 'tier_to' => 50, 'price' => 1984],
                        ['tier_from' => 50, 'tier_to' => 100, 'price' => 2050],
                        ['tier_from' => 100, 'tier_to' => 200, 'price' => 2380],
                        ['tier_from' => 200, 'tier_to' => null, 'price' => 2998],
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

                if ($data['code'] === 'NUOC_BT') {
                    $tiers = [
                        ['tier_from' => 0, 'tier_to' => 10, 'price' => 5973],
                        ['tier_from' => 10, 'tier_to' => 20, 'price' => 7052],
                        ['tier_from' => 20, 'tier_to' => 30, 'price' => 8669],
                        ['tier_from' => 30, 'tier_to' => null, 'price' => 15929],
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

            Property::factory(rand(2, 3))
                ->state(['org_id' => $org->id])
                ->sequence(fn ($sequence) => [
                    'area' => rand(70, 200),
                    'shared_area' => rand(7, 20), // ~10% shared area
                ])
                ->create()
                ->each(function (Property $property, $index) use ($org, $serviceIds) {
                    $floorsCount = rand(3, 4);
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

                    // Create 1-3 Room templates for this property
                    $templateCount = rand(1, 3);
                    $availableAreaPerFloor = $property->area - ($property->shared_area ?? 5);
                    $templates = RoomTemplate::factory($templateCount)->create([
                        'org_id' => $org->id,
                        'property_id' => $property->id,
                        // Realistic Vietnamese room sizes: 15-50m2, mostly 20-30m2
                        'area' => fn() => min(rand(15, 30), $availableAreaPerFloor),
                    ]);
                    $this->command->line("  ├─ Tạo room templates: <fg=cyan>$templateCount</>");

                    // Create floors
                    $this->command->line("  └─ Tạo tầng: <fg=cyan>$floorsCount</>");

                    $totalRoomsInProperty = 0; 

                    for ($i = 1; $i <= $floorsCount; $i++) {
                        $floor = Floor::factory()->create([
                            'org_id' => $org->id,
                            'property_id' => $property->id,
                            'name' => "Tầng $i",
                            'code' => 'F'.str_pad($i, 2, '0', STR_PAD_LEFT),
                            'sort_order' => $i,
                        ]);

                        $availableArea = $property->area - ($property->shared_area ?? 0);
                        // Realistic room count based on area (min 15m2 per room)
                        $maxRoomsByArea = max(1, floor($availableArea / 15));
                        $roomsOnFloor = rand(max(1, floor($maxRoomsByArea / 2)), min(6, $maxRoomsByArea)); 
                        
                        $this->command->line("     • {$floor->name} - Tạo <fg=cyan>$roomsOnFloor</> phòng (Diện tích khả dụng: {$availableArea}m2)");

                        $remainingArea = $availableArea;
                        for ($j = 0; $j < $roomsOnFloor; $j++) {
                            // Pick a random template
                            $template = $templates->random();
                            
                            // Ensure each room leaves enough area for remaining rooms (min 15m2 each)
                            $minAreaForOthers = ($roomsOnFloor - $j - 1) * 15;
                            $maxAllowedForThis = $remainingArea - $minAreaForOthers;
                            
                            $roomArea = min($template->area, $maxAllowedForThis);
                            if ($roomArea < 15) $roomArea = 15;
                            if ($roomArea > $remainingArea) $roomArea = $remainingArea;

                            Room::factory()->create([
                                'org_id' => $org->id,
                                'property_id' => $property->id,
                                'floor_id' => $floor->id,
                                'type' => $template->room_type,
                                'area' => $roomArea,
                                'capacity' => $template->capacity,
                                'base_price' => $template->base_price,
                                'floor_number' => $i,
                            ]);

                            $remainingArea -= $roomArea;
                        }
                    }

                    $this->command->line("     ✅ Tổng cộng <fg=green>" . Room::where('property_id', $property->id)->count() . "</> phòng");

                    // CREATE MASTER METERS
                    $this->command->line("     📡 Tạo đồng hồ tổng cho tòa nhà...");
                    $masterMeterConfigs = [
                        ['type' => 'ELECTRIC', 'prefix' => 'M-E-', 'service_code' => 'DIEN_BT'],
                        ['type' => 'WATER', 'prefix' => 'M-W-', 'service_code' => 'NUOC_BT'],
                    ];

                    foreach ($masterMeterConfigs as $mConfig) {
                        Meter::create([
                            'id' => Str::uuid()->toString(),
                            'org_id' => $org->id,
                            'property_id' => $property->id,
                            'room_id' => null,
                            'service_id' => $serviceIds[$mConfig['service_code']],
                            'code' => $mConfig['prefix'] . $property->code,
                            'type' => $mConfig['type'],
                            'is_master' => true,
                            'base_reading' => 0, // Will be updated if sum is needed
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
                $masterMeterIds = DB::table('meters')
                    ->where('property_id', $property->id)
                    ->where('is_master', true)
                    ->pluck('id', 'type')
                    ->toArray();

                $propertyMonthlyUsage = []; // [month_string][type] => sum_usage
                $initialMeterSum = ['ELECTRIC' => 0, 'WATER' => 0];

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
                        $initialValue = rand(10, 100);
                        Meter::create([
                            'id' => $meterId,
                            'org_id' => $org->id,
                            'property_id' => $room->property_id,
                            'room_id' => $room->id,
                            'service_id' => $serviceIds[$mConfig['type'] === 'ELECTRIC' ? 'DIEN' : 'NUOC'],
                            'code' => $mConfig['prefix'] . $room->code . '-' . rand(10, 99),
                            'type' => $mConfig['type'],
                            'is_master' => false,
                            'base_reading' => $initialValue,
                            'installed_at' => '2025-01-01',
                            'is_active' => true,
                            'created_at' => '2025-01-01',
                            'updated_at' => '2025-01-01',
                        ]);
                        $meters[] = ['id' => $meterId, 'config' => $mConfig, 'last_value' => $initialValue];
                        $initialMeterSum[$mConfig['type']] += $initialValue;
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
                            $org, $room, $ownerId, $currentDate, $endDate, 'ENDED', $meters, $propertyStaffId, $propertyMonthlyUsage
                        );

                        $currentDate = $endDate->copy()->addMonths(1)->startOfMonth();
                    }

                    // 2. Active Contract
                    if ($isActiveRoom && $currentDate->lt($cutoffDate)) {
                        $this->createContractWithInvoices(
                            $org, $room, $ownerId, $currentDate, $currentDate->copy()->addMonths(12)->endOfMonth(), 'ACTIVE', $meters, $propertyStaffId, $propertyMonthlyUsage
                        );
                        $room->update(['status' => 'occupied']);
                    } else {
                        $room->update(['status' => 'draft']);
                    }
                }

                // C. Update Master Meter initial readings
                foreach ($initialMeterSum as $type => $sum) {
                    $masterMeter = Meter::where('property_id', $property->id)
                        ->where('type', $type)
                        ->where('is_master', true)
                        ->first();
                    
                    if ($masterMeter) {
                        $masterMeter->update(['base_reading' => $sum]);
                        
                        // Initial reading placeholder (vốn dĩ đã ở dial này rồi)
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
    $this->command->line('✅ Bất động sản: <fg=cyan>'.Property::count().'</>');
    $this->command->line('✅ Tầng: <fg=cyan>'.Floor::count().'</>');
    $this->command->line('✅ Phòng: <fg=cyan>'.Room::count().'</>');
    $this->command->line('✅ Room Templates: <fg=cyan>'.RoomTemplate::count().'</>');

    // Cập nhật số lượng dữ liệu chi tiết phòng (được sinh ngẫu nhiên)
    $this->command->line('✅ Tài sản phòng (Assets): <fg=cyan>'.RoomAsset::count().'</>');
    $this->command->line('✅ Lịch sử giá (Prices): <fg=cyan>'.RoomPrice::count().'</>');
    $this->command->line('✅ Dịch vụ (Services): <fg=cyan>'.Service::count().'</>');
    $this->command->line('✅ Hợp đồng (Contracts): <fg=cyan>'.Contract::count().'</>');
    $this->command->line('✅ Hóa đơn (Invoices): <fg=cyan>'.Invoice::count().'</>');
    $this->command->line('✅ Sự cố/Yêu cầu (Tickets): <fg=cyan>'.DB::table('tickets')->count().'</>');
    $this->command->line('✅ Bàn giao (Handovers): <fg=cyan>'.Handover::count()."</>\n");
}

    private function createContractWithInvoices($org, $room, $ownerId, $startDate, $endDate, $status, &$meters, $staffId, &$propertyMonthlyUsage)
{
    $cutoffLimit = Carbon::parse('2026-03-31');
    $readingService = app(MeterReadingService::class);
    
    // Calculate fixed services fee (non-metered services)
    $roomServiceIds = DB::table('room_services')->where('room_id', $room->id)->pluck('service_id');
    $fixedServicesFee = DB::table('services')
        ->join('service_rates', 'services.id', '=', 'service_rates.service_id')
        ->whereIn('services.id', $roomServiceIds)
        ->where('services.calc_mode', '!=', 'PER_METER')
        ->sum('service_rates.price');

    $baseRent = $room->base_price ?: 5000000;
    $property = $room->property;
    $depositAmount = $baseRent * ($property->default_deposit_months ?? 1);
    
    $contract = Contract::factory()->create([
        'org_id' => $room->org_id,
        'property_id' => $room->property_id,
        'room_id' => $room->id,
        'status' => $status,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'terminated_at' => $status === 'ENDED' ? $endDate : null,
        'created_by_user_id' => $ownerId,
        'rent_price' => $baseRent,
        'base_rent' => $baseRent,
        'fixed_services_fee' => $fixedServicesFee,
        'total_rent' => $baseRent + $fixedServicesFee,
        'deposit_amount' => $depositAmount,
        'deposit_status' => $status === 'ACTIVE' ? \App\Enums\DepositStatus::HELD : \App\Enums\DepositStatus::REFUNDED,
        'billing_cycle' => $property->default_billing_cycle ?? 'MONTHLY',
        'due_day' => $property->default_due_day ?? 5,
        'cutoff_day' => $property->default_cutoff_day ?? 30,
        'cycle_months' => $startDate->diffInMonths($endDate) ?: 6,
    ]);

    // Create IN Handover
    $this->createHandoverForContract($contract, 'IN', $startDate);

    // Create OUT Handover if ENDED
    if ($status === 'ENDED') {
        $this->createHandoverForContract($contract, 'OUT', $endDate);
    }
    
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

            $reading = $readingService->create([
                'org_id' => $org->id,
                'meter_id' => $m['id'],
                'period_start' => $pStart->toDateString(),
                'period_end' => $pEnd->toDateString(),
                'reading_value' => $newValue,
                'status' => 'SUBMITTED',
                'submitted_by_user_id' => $staffId,
                'submitted_at' => $pEnd->copy()->addDay(),
            ]);

            // Approve to trigger master aggregation
            $readingService->update($reading, ['status' => 'APPROVED']);

            // Aggregate to property monthly total
            $monthKey = $tempDate->toDateString();
            $propertyMonthlyUsage[$monthKey][$m['config']['type']] = ($propertyMonthlyUsage[$monthKey][$m['config']['type']] ?? 0) + $usage;

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

/**
 * Create Handover, Items and Meter Snapshots for a contract
 */
private function createHandoverForContract($contract, $type, $date)
{
    $handover = Handover::create([
        'id' => \Illuminate\Support\Str::uuid()->toString(),
        'org_id' => $contract->org_id,
        'contract_id' => $contract->id,
        'room_id' => $contract->room_id,
        'type' => $type,
        'status' => 'COMPLETED',
        'confirmed_at' => $date,
        'confirmed_by_user_id' => $contract->created_by_user_id,
        'locked_at' => $date,
        'note' => $type === 'IN' ? 'Bàn giao nhận phòng' : 'Bàn giao trả phòng',
    ]);

    // Create Handover Items from Room Assets
    $assets = $contract->room->assets;
    foreach ($assets as $index => $asset) {
        HandoverItem::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'org_id' => $contract->org_id,
            'handover_id' => $handover->id,
            'room_asset_id' => $asset->id,
            'name' => $asset->name,
            'status' => 'GOOD',
            'sort_order' => $index,
        ]);
    }

    // Create Handover Meter Snapshots from Room Meters
    $meters = $contract->room->meters;
    foreach ($meters as $meter) {
        $baseReading = 100; // Mock base
        $readingValue = $type === 'IN' ? $baseReading : $baseReading + rand(50, 200);

        HandoverMeterSnapshot::create([
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'org_id' => $contract->org_id,
            'handover_id' => $handover->id,
            'meter_id' => $meter->id,
            'reading_value' => $readingValue,
        ]);
    }
}
}
