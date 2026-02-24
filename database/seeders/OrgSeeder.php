<?php

namespace Database\Seeders;

use App\Models\Property\Floor;
use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\RoomPhoto;
use App\Models\Property\RoomAsset;
use App\Models\Property\RoomPrice;
use App\Models\Org\User;
use App\Models\Service\Service;
use App\Models\Service\ServiceRate;
use App\Models\Service\TieredRate;
use App\Models\Service\RoomService;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
                ->each(function (User $user, $index) {
                    // Assign roles based on user index
                    if ($index === 0) {
                        $user->assignRole('Owner');
                        $user->update(['email' => 'owner.'.fake()->unique()->slug().'@org.example.com']);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=magenta>Owner</>");
                    } elseif ($index === 1) {
                        $user->assignRole('Manager');
                        $user->update(['email' => 'manager.'.fake()->unique()->slug().'@org.example.com']);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=blue>Manager</>");
                    } elseif ($index === 2) {
                        $user->assignRole('Staff');
                        $user->update(['email' => 'staff.'.fake()->unique()->slug().'@org.example.com']);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=green>Staff</>");
                    } else {
                        $user->assignRole('Tenant');
                        $user->update(['email' => 'tenant.'.fake()->unique()->slug().'@org.example.com']);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=cyan>Tenant</>");
                    }
                });

            // ---------------------------------------------------------
            // 2. CREATE SERVICES FOR THIS ORG
            // ---------------------------------------------------------
            $this->command->info("\n🔧 Tạo Dịch vụ cơ bản cho tổ chức...");
            $serviceDataList = [
                ['code' => 'DIEN','name' => 'Tiền điện', 'calc_mode' => 'PER_METER','unit' => 'kwh','price' => 3500],
                ['code' => 'NUOC','name' => 'Tiền nước', 'calc_mode' => 'PER_METER','unit' => 'm3','price' => 15000],
                ['code' => 'INTERNET','name' => 'Internet', 'calc_mode' => 'PER_ROOM','unit' => 'month','price' => 100000],
                ['code' => 'QL','name' => 'Phí quản lý', 'calc_mode' => 'PER_ROOM','unit' => 'month','price' => 50000],
                ['code' => 'GUIXE','name' => 'Gửi xe máy', 'calc_mode' => 'PER_QUANTITY','unit' => 'bike','price' => 100000],
                ['code' => 'VS','name' => 'Vệ sinh', 'calc_mode' => 'PER_ROOM','unit' => 'month','price' => 30000]
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

                    Floor::factory($floorsPerProperty)
                        ->state(['org_id' => $org->id, 'property_id' => $property->id])
                        ->create()
                        ->each(function (Floor $floor) use ($org, $property, $roomsPerFloor) {
                            $this->command->line("     • Tầng {$floor->name} - Tạo <fg=cyan>$roomsPerFloor</> phòng");

                            Room::factory($roomsPerFloor)
                                ->state(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id])
                                ->create();
                        });

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
                    ]);

                    ContractMember::factory()->create([
                        'org_id' => $contract->org_id,
                        'contract_id' => $contract->id,
                        'user_id' => User::factory()->create(['org_id' => $contract->org_id])->id,
                        'role' => 'TENANT',
                        'is_primary' => true,
                    ]);

                    if (rand(0, 1) === 1) {
                        ContractMember::factory()->create([
                            'org_id' => $contract->org_id,
                            'contract_id' => $contract->id,
                            'user_id' => User::factory()->create(['org_id' => $contract->org_id])->id,
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
                    ]);
                    ContractMember::factory()->create([
                        'org_id' => $contract->org_id,
                        'contract_id' => $contract->id,
                        'user_id' => User::factory()->create(['org_id' => $contract->org_id])->id,
                        'role' => 'TENANT',
                        'is_primary' => true,
                        'left_at' => $contract->end_date,
                    ]);
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
        $this->command->line('✅ Phòng: <fg=cyan>'.($orgCount * $propertiesPerOrg * (($floorsPerProperty * $roomsPerFloor) + $roomsWithoutFloor))."</>");
        
        // Cập nhật số lượng dữ liệu chi tiết phòng (được sinh ngẫu nhiên)
        $this->command->line("✅ Ảnh phòng (Photos): <fg=cyan>".RoomPhoto::count()."</>");
        $this->command->line("✅ Tài sản phòng (Assets): <fg=cyan>".RoomAsset::count()."</>");
        $this->command->line("✅ Lịch sử giá (Prices): <fg=cyan>".RoomPrice::count()."</>");
        $this->command->line("✅ Dịch vụ (Services): <fg=cyan>".Service::count()."</>");
        $this->command->line("✅ Hợp đồng (Contracts): <fg=cyan>".Contract::count()."</>");
        $this->command->line("✅ Hóa đơn (Invoices): <fg=cyan>".Invoice::count()."</>\n");
    }
}
