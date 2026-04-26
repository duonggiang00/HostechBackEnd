<?php

namespace Database\Seeders;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Document\DocumentTemplate;
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
    private static $testTenantCounter = 1;
    private static $freeTenantCounter = 1;

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
            'test'
        ];
        $orgCount = count($orgNames);
        $usersPerOrg = 5;
        $propertiesPerOrg = 1;
        $floorsPerProperty = rand(3, 4);

        $this->command->info('📍 Tạo tổ chức (Organizations)...');
        
        // Cleanup existing 'test' org to avoid unique constraint issues on re-run
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Org::whereIn('name', $orgNames)->withTrashed()->each(function($org) {
            $this->command->line("🗑️  Xóa dữ liệu cũ của tổ chức: <fg=red>{$org->name}</>");
            // Explicitly force delete users and the org to completely clear unique constraint conflicts
            User::where('org_id', $org->id)->withTrashed()->forceDelete();
            $org->forceDelete();
        });
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->line("└─ Số lượng tổ chức: <fg=cyan>$orgCount</>");

        foreach ($orgNames as $name) {
            $org = Org::factory()->create([
                'name' => $name,
                'bank_accounts' => [
                    [
                        'bank_name' => 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
                        'account_number' => '001100' . fake()->numerify('######'),
                        'account_holder' => 'CÔNG TY TNHH ' . strtoupper($name),
                        'branch' => 'Sở giao dịch',
                        'is_default' => true
                    ]
                ]
            ]);
            // Create staff users for this org (Owners, Managers, Staff)
            $usersPerOrg = 5;
            $this->command->info("\n👥 Tạo đội ngũ quản lý cho tổ chức: <fg=yellow>{$org->name}</>");
            $this->command->line("└─ Số lượng: <fg=cyan>$usersPerOrg</>");

            for ($index = 0; $index < $usersPerOrg; $index++) {
                $orgSlug = Str::slug($org->name);
                $email = "";
                $role = "";

                if ($index < 1) {
                    $role = 'Owner';
                    $email = "{$orgSlug}_owner_" . ($index + 1) . "@example.com";
                } elseif ($index < 3) {
                    $role = 'Manager';
                    $email = "{$orgSlug}_manager_" . ($index) . "@example.com";
                } else {
                    $role = 'Staff';
                    $email = "{$orgSlug}_staff_" . ($index - 2) . "@example.com";
                }

                $user = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'org_id' => $org->id,
                        'full_name' => fake('vi_VN')->name(),
                        'phone' => '0' . fake()->numberBetween(3, 9) . fake()->numerify('########'),
                        'identity_number' => fake()->numerify('0############'),
                        'identity_issued_place' => 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội',
                        'identity_issued_date' => '2022-01-15',
                        'date_of_birth' => fake()->dateTimeBetween('-45 years', '-25 years')->format('Y-m-d'),
                        'address' => fake('vi_VN')->address(),
                        'license_plate' => fake()->bothify('??-? ####'),
                        'password_hash' => \Illuminate\Support\Facades\Hash::make('12345678'),
                        'email_verified_at' => now(),
                        'is_active' => true,
                    ]
                );
                $user->syncRoles([$role]);
            }

            // ---------------------------------------------------------
            // 1.5 CREATE DEFAULT DOCUMENT TEMPLATE FOR CONTRACT (HTML/PDF)
            // ---------------------------------------------------------
            $this->command->info("\n📄 Tạo bản mẫu hợp đồng (PDF Template) cho tổ chức...");
            DocumentTemplate::updateOrCreate(
                ['org_id' => $org->id, 'type' => 'CONTRACT'],
                [
                    'id' => (string) Str::uuid(),
                    'name' => 'Hợp đồng thuê mẫu (PDF)',
                    'format' => 'HTML',
                    'content' => '
                        <div style="font-family: DejaVu Sans, sans-serif; font-size: 13px; line-height: 1.5; color: #333;">
                            <div style="text-align: center; text-transform: uppercase;">
                                <h3 style="margin-bottom: 5px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
                                <h4 style="margin-bottom: 5px;">Độc lập - Tự do - Hạnh phúc</h4>
                                <div style="margin: 10px auto; width: 150px; border-bottom: 1px solid #000;"></div>
                            </div>
                            
                            <h2 style="text-align: center; margin-top: 30px; font-size: 20px;">HỢP ĐỒNG THUÊ NHÀ</h2>
                            <p style="text-align: center;">Mã hợp đồng: ${contract_id}</p>

                            <p>Hôm nay, ngày ${created_at} tại tòa nhà ${property_name}</p>
                            <p>Địa chỉ: ${property_address}</p>
                            <p>Chúng tôi gồm:</p>

                            <h3 style="font-size: 14px; background: #f0f0f0; padding: 5px;">BÊN CHO THUÊ (BÊN A)</h3>
                            <table style="width: 100%;">
                                <tr><td><strong>Tổ chức:</strong> ${org_name}</td></tr>
                                <tr><td><strong>Đại diện:</strong> ${rep_full_name}</td><td><strong>Chức vụ:</strong> ${rep_role}</td></tr>
                                <tr><td><strong>CCCD số:</strong> ${rep_identity_number}</td><td><strong>Cấp tại:</strong> ${rep_identity_issued}</td></tr>
                                <tr><td><strong>Địa chỉ:</strong> ${rep_address}</td></tr>
                                <tr><td><strong>Điện thoại:</strong> ${rep_phone}</td></tr>
                            </table>

                            <h3 style="font-size: 14px; background: #f0f0f0; padding: 5px;">BÊN THUÊ NHÀ (BÊN B)</h3>
                            <table style="width: 100%;">
                                <tr><td><strong>Họ và tên:</strong> ${tenant_full_name}</td><td><strong>Năm sinh:</strong> ${tenant_dob}</td></tr>
                                <tr><td><strong>CCCD số:</strong> ${tenant_identity_number}</td><td><strong>Điện thoại:</strong> ${tenant_phone}</td></tr>
                                <tr><td><strong>Địa chỉ HKTT:</strong> ${tenant_address}</td></tr>
                            </table>

                            <h3 style="font-size: 14px; background: #f0f0f0; padding: 5px;">DANH SÁCH THÀNH VIÊN CÙNG Ở</h3>
                            <div style="margin-bottom: 20px;">
                                ${member_list}
                            </div>

                            <p><i>Sau khi hai bên đi đến thống nhất ký kết hợp đồng thuê nhà với các điều kiện sau:</i></p>

                            <h4 style="margin-bottom: 5px;">ĐIỀU 1: NỘI DUNG HỢP ĐỒNG</h4>
                            <p>1.1. Bên A cho bên B thuê phòng <strong>${room_code}</strong>, diện tích <strong>${room_area}m2</strong> tại <strong>${property_name}</strong>.</p>
                            <p>1.2. Mục đích: Để ở. Sức chứa tối đa: ${room_capacity} người.</p>
                            <p>1.3. Thời hạn: ${contract_start_date} đến ${contract_end_date}.</p>

                            <h4 style="margin-bottom: 5px;">ĐIỀU 2: GIÁ THUÊ VÀ THANH TOÁN</h4>
                            <p>2.1. Giá thuê: <strong>${contract_rent_price} VNĐ/tháng</strong>.</p>
                            <p>2.2. Tiền cọc: <strong>${contract_deposit_amount} VNĐ</strong> (${contract_deposit_months} tháng).</p>
                            <p>2.3. Chi phí dịch vụ khác:<br/>${room_service_list}</p>
                            <p>2.4. Thanh toán: ${payment_range}.</p>
                            <p>2.5. Tài khoản ngân hàng (Tòa nhà):<br/>${property_bank_info}</p>
                            <p>2.6. Tài khoản ngân hàng (Công ty):<br/>${org_bank_info}</p>

                            <h4 style="margin-bottom: 5px;">ĐIỀU 3: TRÁCH NHIỆM VÀ QUY ĐỊNH CHUNG</h4>
                            <p><strong>3.1. Các quy định về hành vi và vệ sinh:</strong></p>
                            <div style="white-space: pre-wrap; margin-left: 20px;">${property_house_rules}</div>
                            <p>3.2. Bên thuê có trách nhiệm bảo quản tốt các tài sản, trang thiết bị trong nhà. Nếu hư hỏng do lỗi người dùng phải bồi thường theo giá thị trường.</p>
                            <p>3.3. Tuyệt đối không được khoan tường, đóng đinh, dán giấy khi chưa được sự đồng ý của Bên A.</p>

                            <h4 style="margin-bottom: 5px;">ĐIỀU 4: CHẤM DỨT HỢP ĐỒNG</h4>
                            <p>4.1. Trong trường hợp một trong hai bên muốn chấm dứt hợp đồng trước hạn phải thông báo cho bên kia ít nhất 30 ngày.</p>
                            <p>4.2. Nếu Bên B tự ý chấm dứt hợp đồng mà không báo trước hoặc vi phạm nghiêm trọng các quy định tại Điều 3, Bên A có quyền đơn phương chấm dứt và không hoàn trả tiền đặt cọc.</p>

                            <div style="margin-top: 50px;">
                                <table style="width: 100%; text-align: center;">
                                    <tr>
                                        <td style="width: 50%;">
                                            <strong>BÊN CHO THUÊ (BÊN A)</strong><br/><br/><br/><br/>
                                            ${rep_full_name}
                                        </td>
                                        <td style="width: 50%;">
                                            <strong>BÊN THUÊ (BÊN B)</strong><br/><br/><br/><br/>
                                            ${tenant_full_name}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    ',
                    'is_active' => true,
                ]
            );

            // ---------------------------------------------------------
            // 2. CREATE SERVICES FOR THIS ORG
            // ---------------------------------------------------------
            $this->command->info("\n🔧 Tạo Dịch vụ cơ bản cho tổ chức...");
            $serviceDataList = [
                ['code' => 'DIEN', 'name' => 'Tiền điện', 'calc_mode' => 'PER_METER', 'unit' => 'kwh', 'price' => 4000, 'type' => 'ELECTRIC'],
                ['code' => 'NUOC', 'name' => 'Tiền nước', 'calc_mode' => 'PER_METER', 'unit' => 'm3', 'price' => 30000, 'type' => 'WATER'],
                ['code' => 'DIEN_BT', 'name' => 'Điện bậc thang', 'calc_mode' => 'PER_METER', 'unit' => 'kwh', 'price' => 1984, 'type' => 'ELECTRIC'],
                ['code' => 'NUOC_BT', 'name' => 'Nước bậc thang', 'calc_mode' => 'PER_METER', 'unit' => 'm3', 'price' => 5973, 'type' => 'WATER'],
                ['code' => 'INTERNET', 'name' => 'Internet', 'calc_mode' => 'PER_ROOM', 'unit' => 'month', 'price' => 100000, 'type' => 'OTHER'],
                ['code' => 'QL', 'name' => 'Phí quản lý', 'calc_mode' => 'PER_ROOM', 'unit' => 'month', 'price' => 50000, 'type' => 'OTHER'],
                ['code' => 'GUIXE', 'name' => 'Gửi xe máy', 'calc_mode' => 'PER_QUANTITY', 'unit' => 'bike', 'price' => 100000, 'type' => 'OTHER'],
                ['code' => 'VS', 'name' => 'Vệ sinh', 'calc_mode' => 'PER_ROOM', 'unit' => 'month', 'price' => 30000, 'type' => 'OTHER'],
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

            Property::factory(1)
                ->state([
                    'org_id' => $org->id,
                    'bank_accounts' => [
                        [
                            'bank_name' => 'VPBank',
                            'account_number' => fake()->numerify('##########'),
                            'account_holder' => 'LÊ THỊ NGỌC',
                        ]
                    ],
                    'house_rules' => "- Sử dụng đúng mục đích thuê nhà để ở, có trách nhiệm bảo quản tốt các tài sản thiết bị trong nhà.\n- Tuyệt đối không được khoan tường đóng đinh, dán giấy lên tường nhà khi chưa được sự đồng ý của chủ nhà.\n- Tuyệt đối không vứt giấy vệ sinh, tóc và các vật lạ vào bồn cầu, đường ống thoát nước.\n- Giữ gìn vệ sinh chung, không được để rác trước cửa phòng và hành lang.\n- Không làm ồn sau 10h30 đêm để tránh ảnh hưởng đến các phòng xung quanh.\n- Không tự ý sang nhượng cho người khác. Nếu muốn thêm người ở phải báo với chủ nhà.\n- Trước khi dọn đi phải quét dọn sạch sẽ như lúc đến.",
                ])
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

                    // Create exactly 4 Room templates for this property
                    $templateCount = 4;
                    // Available area per floor (this will be distributed among the 4 templates)
                    $availableAreaPerFloor = $property->area - ($property->shared_area ?? 10);
                    $baseArea = $availableAreaPerFloor / $templateCount;

                    $templates = [];
                    $totalAllocatedArea = 0;

                    for ($t = 0; $t < $templateCount; $t++) {
                        // Area variance: +/- 3-5m2
                        $variance = rand(-5, 5);
                        $templateArea = round($baseArea + $variance, 1);
                        
                        // Ensure it's within bounds and sum doesn't exceed total
                        if ($t === $templateCount - 1) {
                            $templateArea = round($availableAreaPerFloor - $totalAllocatedArea, 1);
                        }
                        
                        if ($templateArea < 10) $templateArea = 10;
                        $totalAllocatedArea += $templateArea;

                        // Capacity logic:
                        // < 10-20m2: 2 người
                        // 20-30m2: 3 người
                        // 30-60m2: 4-5 người
                        // trên 60m2 không quá 6 người
                        if ($templateArea < 20) {
                            $capacity = 2;
                        } elseif ($templateArea < 30) {
                            $capacity = 3;
                        } elseif ($templateArea < 60) {
                            $capacity = rand(4, 5);
                        } else {
                            $capacity = 6;
                        }

                        $templateName = "Mẫu phòng " . $templateArea . " m2 cho " . $capacity . " người ở";

                        $templates[] = RoomTemplate::factory()->create([
                            'org_id' => $org->id,
                            'property_id' => $property->id,
                            'name' => $templateName,
                            'area' => $templateArea,
                            'capacity' => $capacity,
                        ]);
                    }

                    // Attach mandatory services (DIEN, NUOC) and some assets to every template
                    foreach ($templates as $template) {
                        $template->services()->attach([
                            $serviceIds['DIEN'],
                            $serviceIds['NUOC'],
                            $serviceIds['INTERNET'],
                        ]);

                        // Add some default assets
                        $template->assets()->createMany([
                            ['name' => 'Giường 1m6'],
                            ['name' => 'Tủ quần áo'],
                            ['name' => 'Máy lạnh'],
                        ]);
                    }

                    $this->command->line("  ├─ Tạo room templates: <fg=cyan>$templateCount</>");

                    // Create floors
                    $this->command->line("  └─ Tạo tầng: <fg=cyan>$floorsCount</>");

                    for ($i = 1; $i <= $floorsCount; $i++) {
                        $floor = Floor::factory()->create([
                            'org_id'       => $org->id,
                            'property_id'  => $property->id,
                            'name'         => "Tầng $i",
                            'floor_number' => $i,
                            'code'         => 'F'.str_pad($i, 2, '0', STR_PAD_LEFT),
                            'sort_order'   => $i,
                        ]);

                        $roomsOnFloor = $templateCount; // 4 rooms per floor
                        
                        // Skip room creation for Floor 1 as requested
                        if ($i === 1) {
                            $this->command->line("     • {$floor->name} - <fg=gray>Tầng 1 không có phòng (Khu vực lễ tân/chung)</>");
                            continue;
                        }

                        $this->command->line("     • {$floor->name} - Tạo <fg=cyan>$roomsOnFloor</> phòng (Diện tích tối đa: {$availableAreaPerFloor}m2)");

                        for ($j = 0; $j < $roomsOnFloor; $j++) {
                            // Map room to template (one room per template type on each floor)
                            $template = $templates[$j];
                            
                            $roomNumber = ($i * 100) + ($j + 2);
                            // Disable events to prevent RoomObserver from creating default meters
                            Room::withoutEvents(function() use ($org, $property, $floor, $roomNumber, $template, $i) {
                                Room::factory()->create([
                                    'org_id' => $org->id,
                                    'property_id' => $property->id,
                                    'floor_id' => $floor->id,
                                    'name' => (string)$roomNumber,
                                    'code' => 'R' . $roomNumber,
                                    'area' => $template->area,
                                    'capacity' => $template->capacity,
                                    'base_price' => $template->base_price,
                                    'floor_number' => $i,
                                ]);
                            });
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
                $properties = Property::where('org_id', $org->id)->get();
            $baseCodes = ['DIEN', 'NUOC', 'INTERNET', 'QL', 'VS'];
            $ownerId = User::where('org_id', $org->id)->first()->id;

            foreach ($properties as $propertyIdx => $property) {
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
                $occupiedRoomIds = $roomsInProperty->random($numOccupiedRooms)->pluck('id', 'id')->toArray();

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
                            'code' => $mConfig['prefix'] . 'P' . ($propertyIdx + 1) . '-' . $room->code . '-' . strtoupper(Str::random(3)),
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

                    $selectedCodes = ['DIEN', 'NUOC', 'INTERNET', 'QL', 'VS'];
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
                        /** @var \App\Models\Property\Room $room */
                        $room->update(['status' => 'occupied']);
                    } else {
                        // $room->update(['status' => 'draft']);
                    }
                }

                // C. Update Master Meter initial readings
                foreach ($initialMeterSum as $type => $sum) {
                    $masterMeter = Meter::where('property_id', $property->id)
                        ->where('type', $type)
                        ->where('is_master', true)
                        ->first();
                    
                    if ($masterMeter) {
                        /** @var \App\Models\Meter\Meter $masterMeter */
                        $masterMeter->update(['base_reading' => $sum]);
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

    private function createContractWithInvoices($org, $room, $ownerId, $startDate, $endDate, $status, &$meters, $propertyStaffId, &$propertyMonthlyUsage)
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
        
        $emailName = Str::slug($fullName, '.');
        $email = $emailName . fake()->numberBetween(10, 99) . "@gmail.com";
        
        $u = User::create([
            'id' => Str::uuid()->toString(),
            'org_id' => $org->id,
            'full_name' => $fullName,
            'email' => $email,
            'password_hash' => \Illuminate\Support\Facades\Hash::make('12345678'),
            'email_verified_at' => now(),
            'is_active' => true,
            'phone' => '0' . fake()->numberBetween(3, 9) . fake()->numerify('########'),
            'identity_number' => fake()->numerify('0############'),
            'identity_issued_place' => 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội',
            'identity_issued_date' => fake()->dateTimeBetween('-5 years', 'now')->format('Y-m-d'),
            'date_of_birth' => fake()->dateTimeBetween('-40 years', '-18 years')->format('Y-m-d'),
            'address' => fake('vi_VN')->address(),
            'license_plate' => fake()->bothify('??-? ####'),
        ]);
        $u->assignRole('Tenant');

            ContractMember::create([
                'id' => Str::uuid()->toString(),
                'org_id' => $contract->org_id,
                'contract_id' => $contract->id,
                'user_id' => $u->id,
                'full_name' => $fullName,
                'phone' => $u->phone,
                'identity_number' => $u->identity_number,
                'date_of_birth' => $u->date_of_birth,
                'license_plate' => $u->license_plate,
                'role' => $i === 0 ? 'TENANT' : 'ROOMMATE',
                'is_primary' => $i === 0,
                'left_at' => $status === 'ENDED' ? $endDate : null,
            ]);
    }

    // --- Generate Physical Contract Document ---
    try {
        $docPath = app(\App\Services\Contract\ContractDocumentService::class)->generateDocument($contract);
        $contract->update([
            'document_path' => $docPath,
            'document_type' => 'PDF',
            'signed_at' => $startDate,
        ]);
    } catch (\Exception $e) {
        $this->command->warn("  - Could not generate contract document: " . $e->getMessage());
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

        // --- Utility Readings ---
        $pStart = $tempDate->copy()->startOfMonth();
        $pEnd = $tempDate->copy()->endOfMonth();

        foreach ($meters as &$m) {
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
                'submitted_by_user_id' => $propertyStaffId,
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

        // --- Generate Physical Invoice PDF ---
        try {
            app(\App\Services\Invoice\InvoicePdfService::class)->generate($invoice);
        } catch (\Exception $e) {
            $this->command->warn("  - Could not generate invoice PDF: " . $e->getMessage());
        }

        // --- Generate Payment & Receipt if PAID ---
        if ($invoice->status === 'PAID') {
            try {
                $tenantMember = $contract->members()->where('role', 'TENANT')->first();
                $payment = \App\Models\Finance\Payment::create([
                    'id' => (string) Str::uuid(),
                    'org_id' => $org->id,
                    'property_id' => $invoice->property_id,
                    'payer_user_id' => $tenantMember ? $tenantMember->user_id : $ownerId,
                    'received_by_user_id' => $ownerId,
                    'method' => 'CASH',
                    'amount' => $total,
                    'received_at' => $invoice->issue_date,
                    'status' => 'APPROVED',
                    'approved_by_user_id' => $ownerId,
                    'approved_at' => $invoice->issue_date,
                ]);

                \App\Models\Finance\PaymentAllocation::create([
                    'id' => (string) Str::uuid(),
                    'org_id' => $org->id,
                    'payment_id' => $payment->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $total,
                ]);

                app(\App\Services\Finance\ReceiptService::class)->generateForPayment($payment);
            } catch (\Exception $e) {
                $this->command->warn("  - Could not generate receipt: " . $e->getMessage());
            }
        }

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
