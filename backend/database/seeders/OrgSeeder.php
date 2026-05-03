<?php

namespace Database\Seeders;

use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Contract\FinalPaymentRequest;
use App\Models\Contract\RefundReceipt;
use App\Models\Document\DocumentTemplate;
use App\Models\Finance\LedgerEntry;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentAllocation;
use App\Models\Handover\Handover;
use App\Models\Handover\HandoverItem;
use App\Models\Handover\HandoverMeterSnapshot;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Models\Meter\Meter;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use App\Models\Property\RoomPrice;
use App\Models\Property\RoomTemplate;
use App\Models\Service\Service;
use App\Services\Contract\ContractDocumentService;
use App\Services\Contract\ContractService;
use App\Services\Contract\Termination\TerminationReconciliationService;
use App\Services\Finance\LedgerService;
use App\Services\Finance\ReceiptService;
use App\Services\Identity\IdCardImageRenderService;
use App\Services\Invoice\InvoicePdfService;
use App\Services\Invoice\InvoiceService;
use App\Services\Meter\MeterReadingService;
use App\Services\Property\RoomService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OrgSeeder extends Seeder
{
    private static $testTenantCounter = 1;

    private static $freeTenantCounter = 1;

    /**
     * 7 khách demo (org "test"): 6 người đầu — HĐ ACTIVE trên 6 phòng đầu (sort theo code);
     * người cuối (Đỗ Minh Đức) — HĐ ENDED trên phòng 501. Chỉ primary tenant (không roommate).
     */
    private const PRIMARY_DEMO_TENANTS = [
        [
            'full_name' => 'Dương Trường Giang',
            'phone' => '0986526273',
            'email' => 'duongtruonggiang31072000@gmail.com',
            'identity_number' => '001200029362',
            'identity_issued_place' => 'Bộ công an',
            'identity_issued_date' => '2025-07-31',
            'date_of_birth' => '2000-07-31',
            'address' => 'Hà Nội',
            'seed_billing_cycle_months' => 3,
        ],
        [
            'full_name' => 'Đồng Huy Giáp',
            'phone' => '0986506074',
            'email' => 'donghuygiap@gmail.com',
            'identity_number' => '001200029360',
            'identity_issued_place' => 'Bộ công an',
            'identity_issued_date' => '2025-07-31',
            'date_of_birth' => '2003-07-31',
            'address' => 'Hà Nội',
        ],
        [
            'full_name' => 'Lê Công Tuấn',
            'phone' => '0986546479',
            'email' => 'lecongtuan@gmail.com',
            'identity_number' => '001200029361',
            'identity_issued_place' => 'Bộ công an',
            'identity_issued_date' => '2025-07-31',
            'date_of_birth' => '2002-07-31',
            'address' => 'Hà Nội',
        ],
        [
            'full_name' => 'Vũ Minh Hiếu',
            'phone' => '0986576790',
            'email' => 'vuminhhieu@gmail.com',
            'identity_number' => '001200029367',
            'identity_issued_place' => 'Bộ công an',
            'identity_issued_date' => '2025-07-31',
            'date_of_birth' => '2001-07-31',
            'address' => 'Hà Nội',
            /** Nợ định kỳ tháng 3/2026 (ISSUED/OVERDUE) — demo thanh lý trên HĐ ACTIVE */
            'seed_unpaid_period_starts' => ['2026-03-01'],
        ],
        [
            'full_name' => 'Phùng Xuân Quý',
            'phone' => '0986576798',
            'email' => 'phungxuanquy@gmail.com',
            'identity_number' => '001200029364',
            'identity_issued_place' => 'Bộ công an',
            'identity_issued_date' => '2025-07-31',
            'date_of_birth' => '2003-07-31',
            'address' => 'Hà Nội',
            'seed_billing_cycle_months' => 6,
        ],
        [
            'full_name' => 'Nguyễn Đình Tuấn',
            'phone' => '0986576211',
            'email' => 'nguyendinhtuan@gmail.com',
            'identity_number' => '001200028111',
            'identity_issued_place' => 'Bộ công an',
            'identity_issued_date' => '2025-07-31',
            'date_of_birth' => '2002-07-31',
            'address' => 'Hà Nội',
            /** Nợ định kỳ tháng 3/2026 — demo thanh lý trên HĐ ACTIVE (cùng kỳ với Vũ Minh Hiếu) */
            'seed_unpaid_period_starts' => ['2026-03-01'],
        ],
        [
            'full_name' => 'Đỗ Minh Đức',
            'phone' => '0986576791',
            'email' => 'dominhduc@gmail.com',
            'identity_number' => '001200024231',
            'identity_issued_place' => 'Bộ công an',
            'identity_issued_date' => '2025-07-31',
            'date_of_birth' => '2002-07-31',
            'address' => 'Hà Nội',
            /**
             * HĐ TERMINATED phòng 501: bàn giao + chỉ số tháng cuối (giống pipeline thật), các kỳ trước đã thanh toán.
             * Không seed sẵn hóa đơn is_termination / reconcile — để demo thanh lý trực tiếp trên HĐ ACTIVE có nợ
             * (Vũ Minh Hiếu, Nguyễn Đình Tuấn — nợ tháng 3/2026). Cuối seed có phiếu hoàn cọc đã chi + PDF cho HĐ này (phòng 501).
             */
            'seed_deposit_refund_demo' => true,
        ],
    ];

    public function run(): void
    {
        Mail::fake();
        Notification::fake();

        $this->command->info("\n================================");
        $this->command->info('📊 BẮT ĐẦU SEED DỮ LIỆU');
        $this->command->info("================================\n");

        $this->purgeSeedFinanceAndContractFiles();

        // Create system-wide Admin (Single System Administrator)
        $this->command->info('👤 Tạo tài khoản Administrator toàn quyền hệ thống...');
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'full_name' => 'System Administrator',
                'password_hash' => Hash::make('12345678'),
                'org_id' => null,
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $admin->assignRole('Admin');
        $this->command->line("✅ System Admin: admin@example.com (Mật khẩu: 12345678)\n");

        $orgNames = [
            'test',
        ];
        $orgCount = count($orgNames);
        $usersPerOrg = 3;
        $propertiesPerOrg = 1;

        $this->command->info('📍 Tạo tổ chức (Organizations)...');

        // Cleanup existing 'test' org to avoid unique constraint issues on re-run
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Org::whereIn('name', $orgNames)->withTrashed()->each(function ($org) {
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
                        'account_number' => '001100'.fake()->numerify('######'),
                        'account_name' => 'CÔNG TY TNHH '.strtoupper($name),
                        'branch' => 'Sở giao dịch',
                        'is_default' => true,
                    ],
                ],
            ]);
            // Owner / Manager / Staff — email cố định, mật khẩu 12345678
            $this->command->info("\n👥 Tạo đội ngũ quản lý cho tổ chức: <fg=yellow>{$org->name}</>");
            $this->command->line('└─ Owner / Manager / Staff (mật khẩu: <fg=cyan>12345678</>)');

            $orgStaffAccounts = [
                ['role' => 'Owner', 'email' => 'hostech_owner@example.com', 'full_name' => 'Chủ nhà Hostech'],
                ['role' => 'Manager', 'email' => 'hostech_manager@example.com', 'full_name' => 'Quản lý Hostech'],
                ['role' => 'Staff', 'email' => 'hostech_staff@example.com', 'full_name' => 'Nhân viên Hostech'],
            ];

            foreach ($orgStaffAccounts as $acct) {
                $user = User::updateOrCreate(
                    ['email' => $acct['email']],
                    [
                        'org_id' => $org->id,
                        'full_name' => $acct['full_name'],
                        'phone' => '0'.fake()->numberBetween(3, 9).fake()->numerify('########'),
                        'identity_number' => fake()->numerify('0############'),
                        'identity_issued_place' => 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội',
                        'identity_issued_date' => '2022-01-15',
                        'date_of_birth' => fake()->dateTimeBetween('-45 years', '-25 years')->format('Y-m-d'),
                        'address' => fake('vi_VN')->address(),
                        'license_plate' => fake()->bothify('??-? ####'),
                        'password_hash' => Hash::make('12345678'),
                        'email_verified_at' => now(),
                        'is_active' => true,
                    ]
                );
                $user->syncRoles([$acct['role']]);
            }
            $this->command->line('   • hostech_owner@example.com / hostech_manager@example.com / hostech_staff@example.com');

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

                            <p>${contract_created_at_vn}, tại tòa nhà ${property_name}.</p>
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
                            <p>2.2. Tiền đặt cọc:</p>
                            <ul style="margin-top: 0;">
                                <li>Số tháng cọc: <strong>${contract_deposit_months} tháng</strong>.</li>
                                <li>Công thức: (Tiền thuê phòng + Tổng phí dịch vụ cố định) × Số tháng cọc.</li>
                                <li>= (${contract_rent_price} + ${contract_fixed_services_fee}) × ${contract_deposit_months} = <strong>${contract_deposit_amount} VNĐ</strong>.</li>
                                <li>Tiền cọc sẽ được hoàn trả sau khi thanh lý hợp đồng, trừ các khoản nợ còn lại. Bên B đơn phương chấm dứt hợp đồng trước thời hạn thì tiền cọc sẽ không được hoàn trả.</li>
                            </ul>
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
                                        <td style="width: 50%; vertical-align: top;">
                                            <strong>BÊN CHO THUÊ (BÊN A)</strong><br/><br/>
                                            ${signature_landlord}<br/><br/>
                                            ${rep_full_name}
                                        </td>
                                        <td style="width: 50%; vertical-align: top;">
                                            <strong>BÊN THUÊ (BÊN B)</strong><br/><br/>
                                            ${signature_tenant}<br/><br/>
                                            ${tenant_full_name}
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin-top: 24px; text-align: center;"><strong>${contract_created_at_vn}</strong></p>
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
                    'name' => 'Nhà Trọ Hostech',
                    'area' => 60,
                    'shared_area' => 5,
                    'bank_accounts' => [
                        [
                            'bank_name' => 'VPBank',
                            'account_number' => fake()->numerify('##########'),
                            'account_name' => 'LÊ THỊ NGỌC',
                        ],
                    ],
                    'house_rules' => "- Sử dụng đúng mục đích thuê nhà để ở, có trách nhiệm bảo quản tốt các tài sản thiết bị trong nhà.\n- Tuyệt đối không được khoan tường đóng đinh, dán giấy lên tường nhà khi chưa được sự đồng ý của chủ nhà.\n- Tuyệt đối không vứt giấy vệ sinh, tóc và các vật lạ vào bồn cầu, đường ống thoát nước.\n- Giữ gìn vệ sinh chung, không được để rác trước cửa phòng và hành lang.\n- Không làm ồn sau 10h30 đêm để tránh ảnh hưởng đến các phòng xung quanh.\n- Không tự ý sang nhượng cho người khác. Nếu muốn thêm người ở phải báo với chủ nhà.\n- Trước khi dọn đi phải quét dọn sạch sẽ như lúc đến.",
                ])
                ->create()
                ->each(function (Property $property, $index) use ($org, $serviceIds) {
                    $floorsCount = 5;
                    $templateCount = 2;
                    $roomsPerOccupiedFloor = 2;

                    // Get all managers and staff for this org
                    $managers = User::where('org_id', $org->id)->role('Manager')->get();
                    $staffs = User::where('org_id', $org->id)->role('Staff')->get();

                    $manager = $managers->first()
                        ?? User::where('org_id', $org->id)->role('Owner')->firstOrFail();
                    $staff1 = $staffs->first() ?? $manager;
                    $staff2 = $staffs->get(1) ?? $staff1;

                    $propertyUserIds = collect([$manager?->id, $staff1?->id, $staff2?->id])
                        ->filter()
                        ->unique()
                        ->values()
                        ->all();
                    if ($propertyUserIds !== []) {
                        $property->managers()->sync($propertyUserIds);
                    }

                    $this->command->info("\n  📐 Bất động sản: <fg=yellow>{$property->name}</> (Mã: {$property->code})");

                    $assetGood = ['condition' => 'Tốt', 'quantity' => 1];

                    $templates = [
                        RoomTemplate::factory()->create([
                            'org_id' => $org->id,
                            'property_id' => $property->id,
                            'name' => 'Mẫu phòng 25m² (tối đa 3 người)',
                            'area' => 25,
                            'capacity' => 3,
                            'base_price' => 3_000_000,
                            'description' => 'Phòng mẫu 1 — giá niêm yết 3.000.000đ/tháng.',
                        ]),
                        RoomTemplate::factory()->create([
                            'org_id' => $org->id,
                            'property_id' => $property->id,
                            'name' => 'Mẫu phòng 30m² (tối đa 3 người)',
                            'area' => 30,
                            'capacity' => 3,
                            'base_price' => 3_500_000,
                            'description' => 'Phòng mẫu 2 — giá niêm yết 3.500.000đ/tháng.',
                        ]),
                    ];

                    $templates[0]->assets()->createMany([
                        array_merge($assetGood, ['name' => 'Giường 2x1.8m²']),
                        array_merge($assetGood, ['name' => 'Điều hòa Panasonic']),
                        array_merge($assetGood, ['name' => 'Bình nóng lạnh Ferroli']),
                    ]);

                    $templates[1]->assets()->createMany([
                        array_merge($assetGood, ['name' => 'Giường 2x2m²']),
                        array_merge($assetGood, ['name' => 'Tủ lạnh Toshiba']),
                        array_merge($assetGood, ['name' => 'Điều hòa Panasonic']),
                        array_merge($assetGood, ['name' => 'Bình nóng lạnh Ferroli']),
                    ]);

                    // Attach seeded room images to templates
                    $templateImageGroups = $this->resolveRoomTemplateImageGroups();
                    foreach ($templates as $idx => $template) {
                        $groupIndex = $idx + 1;
                        $imagePaths = $templateImageGroups[$groupIndex] ?? [];
                        foreach ($imagePaths as $imgPath) {
                            $template->addMedia($imgPath)
                                ->preservingOriginal()
                                ->toMediaCollection('gallery');
                        }
                    }

                    foreach ($templates as $template) {
                        $template->services()->attach([
                            $serviceIds['DIEN'],
                            $serviceIds['NUOC'],
                            $serviceIds['INTERNET'],
                        ]);
                    }

                    $this->command->line("  ├─ Tạo room templates: <fg=cyan>$templateCount</> (25m² / 30m², capacity 3)");

                    $this->command->line("  └─ Tạo tầng: <fg=cyan>$floorsCount</> (tầng 1 không có phòng; mỗi tầng còn lại <fg=cyan>$roomsPerOccupiedFloor</> phòng)");

                    $roomService = app(RoomService::class);

                    for ($i = 1; $i <= $floorsCount; $i++) {
                        $floor = Floor::factory()->create([
                            'org_id' => $org->id,
                            'property_id' => $property->id,
                            'name' => "Tầng $i",
                            'floor_number' => $i,
                            'code' => 'F'.str_pad($i, 2, '0', STR_PAD_LEFT),
                            'sort_order' => $i,
                        ]);

                        if ($i === 1) {
                            $this->command->line("     • {$floor->name} - <fg=gray>Tầng 1 không có phòng (Khu vực lễ tân/chung)</>");

                            continue;
                        }

                        $this->command->line("     • {$floor->name} - Tạo <fg=cyan>$roomsPerOccupiedFloor</> phòng (2 mẫu: 25m² + 30m²)");

                        for ($j = 0; $j < $roomsPerOccupiedFloor; $j++) {
                            $template = $templates[$j];
                            $roomNumber = ($i * 100) + ($j + 1);
                            $roomService->createFromTemplate($template->id, [
                                'floor_id' => $floor->id,
                                'name' => (string) $roomNumber,
                                'code' => (string) $roomNumber,
                                'floor_number' => $i,
                            ], $manager);
                        }
                    }

                    $this->command->line('     ✅ Tổng cộng <fg=green>'.Room::where('property_id', $property->id)->count().'</> phòng');

                    // CREATE MASTER METERS
                    $this->command->line('     📡 Tạo đồng hồ tổng cho tòa nhà...');
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
                            'code' => $mConfig['prefix'].$property->code,
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

                $roomsInProperty = Room::where('property_id', $property->id)->orderBy('code')->get();
                $roomToDemoTenantIndex = [];
                if ($org->name === 'test') {
                    $demoActiveTenantCount = count(self::PRIMARY_DEMO_TENANTS) - 1;
                    if ($roomsInProperty->count() < $demoActiveTenantCount) {
                        $this->command->warn("  ⚠ Demo tenant ACTIVE: cần {$demoActiveTenantCount} phòng nhưng chỉ {$roomsInProperty->count()} phòng.");
                    }
                    $fixedDemoRoomIds = $roomsInProperty->take($demoActiveTenantCount)->pluck('id')->all();
                    foreach ($fixedDemoRoomIds as $idx => $rid) {
                        $roomToDemoTenantIndex[$rid] = $idx;
                    }
                    $occupiedRoomIds = collect($fixedDemoRoomIds)->mapWithKeys(fn ($id) => [$id => $id])->all();
                } else {
                    $occupancyRate = rand(50, 80) / 100;
                    $numOccupiedRooms = round($roomsInProperty->count() * $occupancyRate);
                    $occupiedRoomIds = $roomsInProperty->random($numOccupiedRooms)->pluck('id', 'id')->toArray();
                }

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
                        $existingMeter = Meter::where('room_id', $room->id)
                            ->where('type', $mConfig['type'])
                            ->first();

                        if ($existingMeter) {
                            $meterId = $existingMeter->id;
                            $initialValue = (int) $existingMeter->base_reading;
                        } else {
                            $meterId = Str::uuid()->toString();
                            $initialValue = 0;
                            Meter::create([
                                'id' => $meterId,
                                'org_id' => $org->id,
                                'property_id' => $room->property_id,
                                'room_id' => $room->id,
                                'code' => $mConfig['prefix'].'P'.($propertyIdx + 1).'-'.$room->code.'-'.strtoupper(Str::random(3)),
                                'type' => $mConfig['type'],
                                'is_master' => false,
                                'base_reading' => $initialValue,
                                'installed_at' => '2026-01-01',
                                'is_active' => true,
                                'created_at' => '2026-01-01',
                                'updated_at' => '2026-01-01',
                            ]);
                        }

                        $meters[] = ['id' => $meterId, 'config' => $mConfig, 'last_value' => $initialValue];
                        $initialMeterSum[$mConfig['type']] += $initialValue;
                    }

                    // createFromTemplate đã sync DIEN/NUOC/INTERNET — chỉ bổ sung QL/VS (insertOrIgnore tránh trùng unique room_id+service_id)
                    $selectedCodes = ['DIEN', 'NUOC', 'INTERNET', 'QL', 'VS'];
                    foreach ($selectedCodes as $code) {
                        DB::table('room_services')->insertOrIgnore([
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
                    $currentDate = Carbon::parse('2025-10-01');
                    $cutoffDate = Carbon::parse('2026-03-31');
                    $isActiveRoom = in_array($room->id, $occupiedRoomIds);

                    // Phòng 501: HĐ TERMINATED 10/2025 → 3/2026 cho Đỗ Minh Đức (profile cuối PRIMARY_DEMO_TENANTS), có bàn giao trả phòng
                    $isTerminatedDemoRoom501 = $org->name === 'test' && (string) $room->code === '501';

                    if ($isTerminatedDemoRoom501) {
                        $endedProfile = self::PRIMARY_DEMO_TENANTS[count(self::PRIMARY_DEMO_TENANTS) - 1];
                        $this->createContractWithInvoices(
                            $org,
                            $room,
                            $ownerId,
                            Carbon::parse('2025-10-01')->startOfMonth(),
                            Carbon::parse('2026-03-31')->endOfMonth(),
                            ContractStatus::TERMINATED->value,
                            $meters,
                            $propertyStaffId,
                            $propertyMonthlyUsage,
                            $endedProfile
                        );
                        $room->update(['status' => 'available']);

                        continue;
                    }

                    // Phòng 502: không HĐ (phòng trống demo)
                    if ($org->name === 'test' && (string) $room->code === '502') {
                        $room->update(['status' => 'available']);

                        continue;
                    }

                    $numEndedContracts = ($org->name === 'test' && $isActiveRoom)
                        ? 0
                        : rand(1, 2);

                    // 1. Terminated Contracts
                    for ($k = 0; $k < $numEndedContracts; $k++) {
                        if ($currentDate->gt($cutoffDate->copy()->subMonths(6))) {
                            break;
                        }

                        $duration = rand(3, 6);
                        $endDate = $currentDate->copy()->addMonths($duration);

                        $this->createContractWithInvoices(
                            $org, $room, $ownerId, $currentDate, $endDate, ContractStatus::TERMINATED->value, $meters, $propertyStaffId, $propertyMonthlyUsage
                        );

                        $currentDate = $endDate->copy()->addMonths(1)->startOfMonth();
                    }

                    // 2. Active Contract
                    if ($isActiveRoom && $currentDate->lt($cutoffDate)) {
                        $fixedPrimary = ($org->name === 'test' && isset($roomToDemoTenantIndex[$room->id]))
                            ? self::PRIMARY_DEMO_TENANTS[$roomToDemoTenantIndex[$room->id]]
                            : null;
                        $this->createContractWithInvoices(
                            $org, $room, $ownerId, $currentDate, $currentDate->copy()->addMonths(12)->endOfMonth(), 'ACTIVE', $meters, $propertyStaffId, $propertyMonthlyUsage, $fixedPrimary
                        );
                        /** @var Room $room */
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
                        /** @var Meter $masterMeter */
                        $masterMeter->update(['base_reading' => $sum]);
                    }
                }
            }
        }

        $this->seedDomMinhDuc501TerminationRefundDemo();

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

    /**
     * Xóa file bản mềm do seed/laravel tạo (hóa đơn PDF, biên lai PDF, hợp đồng PDF/DOCX, chữ ký tạm)
     * để mỗi lần chạy OrgSeeder không tích lũy file cũ trong storage (và symlink public/storage).
     */
    private function purgeSeedFinanceAndContractFiles(): void
    {
        $this->command->info('🧹 Dọn file hóa đơn / biên lai / hợp đồng cũ trong storage...');

        try {
            foreach (['invoices', 'receipts'] as $dir) {
                if (Storage::disk('public')->exists($dir)) {
                    Storage::disk('public')->deleteDirectory($dir);
                }
            }

            foreach (['contracts/documents', 'contracts/signatures'] as $dir) {
                if (Storage::disk('local')->exists($dir)) {
                    Storage::disk('local')->deleteDirectory($dir);
                }
            }

            $this->command->line('   └─ <fg=green>Đã xóa thư mục:</> public disk: invoices, receipts — local disk: contracts/documents, contracts/signatures');
        } catch (\Throwable $e) {
            $this->command->warn('   ⚠ Không dọn hết storage: '.$e->getMessage());
        }
    }

    private function createContractWithInvoices($org, $room, $ownerId, $startDate, $endDate, $status, &$meters, $propertyStaffId, &$propertyMonthlyUsage, ?array $fixedPrimaryTenant = null)
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
        $totalRentForDeposit = $baseRent + $fixedServicesFee;
        $depositMonths = (int) ($property->default_deposit_months ?? 1);
        $depositMonths = max(1, min(24, $depositMonths <= 0 ? 1 : $depositMonths));
        $depositAmount = $totalRentForDeposit * $depositMonths;

        $billingCycleMonths = 1;
        if ($fixedPrimaryTenant !== null && isset($fixedPrimaryTenant['seed_billing_cycle_months'])) {
            $billingCycleMonths = max(1, min(12, (int) $fixedPrimaryTenant['seed_billing_cycle_months']));
        } else {
            $raw = $property->default_billing_cycle ?? 'MONTHLY';
            $billingCycleMonths = match (strtoupper((string) $raw)) {
                'QUARTERLY' => 3,
                'SEMI_ANNUALLY' => 6,
                'YEARLY' => 12,
                default => ctype_digit((string) $raw) ? max(1, (int) $raw) : 1,
            };
        }
        $billingCycleNormalized = (string) $billingCycleMonths;

        // HĐ demo (Đỗ Minh Đức) đi qua pipeline thanh lý EDA thật → status cuối là TERMINATED.
        $isDemoTermination = $status === ContractStatus::TERMINATED->value && ($fixedPrimaryTenant['seed_deposit_refund_demo'] ?? false);
        $effectiveStatus = $status;
        $isEndedLike = $effectiveStatus === ContractStatus::TERMINATED->value;

        $contract = Contract::factory()->create([
            'org_id' => $room->org_id,
            'property_id' => $room->property_id,
            'room_id' => $room->id,
            'status' => $effectiveStatus,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'terminated_at' => $isEndedLike ? $endDate : null,
            'created_by_user_id' => $ownerId,
            'rent_price' => $baseRent,
            'base_rent' => $baseRent,
            'fixed_services_fee' => $fixedServicesFee,
            'total_rent' => $totalRentForDeposit,
            'deposit_amount' => $depositAmount,
            'deposit_months' => $depositMonths,
            'deposit_status' => match (true) {
                $effectiveStatus === 'ACTIVE' => DepositStatus::HELD,
                $isDemoTermination => DepositStatus::HELD,
                $isEndedLike => DepositStatus::REFUNDED,
                default => DepositStatus::HELD,
            },
            'billing_cycle' => $billingCycleNormalized,
            'due_day' => $property->default_due_day ?? 5,
            'cutoff_day' => $property->default_cutoff_day ?? 30,
            'cycle_months' => $startDate->diffInMonths($endDate) ?: 6,
            'next_billing_date' => $startDate->copy()->addMonths($billingCycleMonths)->format('Y-m-d'),
        ]);

        // OUT handover: HĐ demo thì hoãn snapshot meter cho tới sau khi seed reading tháng cuối (xem dưới).
        if ($isEndedLike && ! $isDemoTermination) {
            $this->createHandoverForContract($contract, 'OUT', $endDate);
        } elseif ($isDemoTermination) {
            $this->createHandoverForContract($contract, 'OUT', $endDate, withMeterSnapshots: false);
        }

        $useFixedPrimary = $fixedPrimaryTenant !== null && ($effectiveStatus === 'ACTIVE' || $isEndedLike);
        $numMembers = $useFixedPrimary ? 1 : rand(2, 3);
        $cccdFront = $this->resolveCccdTemplateFrontPath();
        $cccdBack = $this->resolveCccdTemplateBackPath();
        $idCardRender = app(IdCardImageRenderService::class);

        if ((! $cccdFront || ! $cccdBack) && $numMembers > 0) {
            $this->command->warn('  - CCCD: thiếu file mẫu (database/data/identity hoặc mặt trước/sau CC.png ở thư mục repo).');
        } elseif (! $idCardRender->canRender() && $numMembers > 0) {
            $this->command->warn('  - CCCD: không render được (PHP gd + font TTF).');
        }

        for ($i = 0; $i < $numMembers; $i++) {
            if ($useFixedPrimary && $i === 0) {
                $fullName = $fixedPrimaryTenant['full_name'];
                $email = $fixedPrimaryTenant['email'];
                $gender = 'Nam';

                $u = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'org_id' => $org->id,
                        'full_name' => $fullName,
                        'password_hash' => Hash::make('12345678'),
                        'email_verified_at' => now(),
                        'is_active' => true,
                        'phone' => $fixedPrimaryTenant['phone'],
                        'identity_number' => $fixedPrimaryTenant['identity_number'],
                        'identity_issued_place' => $fixedPrimaryTenant['identity_issued_place'],
                        'identity_issued_date' => $fixedPrimaryTenant['identity_issued_date'],
                        'date_of_birth' => $fixedPrimaryTenant['date_of_birth'],
                        'address' => $fixedPrimaryTenant['address'],
                        'license_plate' => fake()->bothify('??-? ####'),
                    ]
                );
                if (! $u->hasRole('Tenant')) {
                    $u->assignRole('Tenant');
                }
            } else {
                // Dynamically create a tenant user for each contract member
                $fullName = fake('vi_VN')->name();

                $emailName = Str::slug($fullName, '.');
                $email = $emailName.fake()->numberBetween(10, 99).'@gmail.com';
                $gender = fake()->randomElement(['Nam', 'Nữ']);

                $u = User::create([
                    'id' => Str::uuid()->toString(),
                    'org_id' => $org->id,
                    'full_name' => $fullName,
                    'email' => $email,
                    'password_hash' => Hash::make('12345678'),
                    'email_verified_at' => now(),
                    'is_active' => true,
                    'phone' => '0'.fake()->numberBetween(3, 9).fake()->numerify('########'),
                    'identity_number' => fake()->numerify('0############'),
                    'identity_issued_place' => 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội',
                    'identity_issued_date' => fake()->dateTimeBetween('-5 years', 'now')->format('Y-m-d'),
                    'date_of_birth' => fake()->dateTimeBetween('-40 years', '-18 years')->format('Y-m-d'),
                    'address' => fake('vi_VN')->address(),
                    'license_plate' => fake()->bothify('??-? ####'),
                ]);
                $u->assignRole('Tenant');
            }

            $member = ContractMember::create([
                'id' => Str::uuid()->toString(),
                'org_id' => $contract->org_id,
                'contract_id' => $contract->id,
                'user_id' => $u->id,
                'email' => $email,
                'full_name' => $fullName,
                'phone' => $u->phone,
                'identity_number' => $u->identity_number,
                'date_of_birth' => $u->date_of_birth,
                'gender' => $gender,
                'nationality' => 'Việt Nam',
                'license_plate' => $u->license_plate,
                'permanent_address' => $u->address,
                'role' => $i === 0 ? 'TENANT' : 'ROOMMATE',
                'is_primary' => $i === 0,
                'left_at' => $isEndedLike ? $endDate : null,
            ]);

            if ($cccdFront && $cccdBack && $idCardRender->canRender()) {
                try {
                    $identity = [
                        'full_name' => $fullName,
                        'identity_number' => (string) $u->identity_number,
                        'date_of_birth' => Carbon::parse($u->date_of_birth)->format('d/m/Y'),
                        'gender' => $gender,
                        'nationality' => 'Việt Nam',
                    ];
                    [$tmpFront, $tmpBack] = $idCardRender->renderPair($cccdFront, $cccdBack, $identity);
                    $member->addMedia($tmpFront)->toMediaCollection('identity_front');
                    $member->addMedia($tmpBack)->toMediaCollection('identity_back');
                    @unlink($tmpFront);
                    @unlink($tmpBack);
                } catch (\Throwable $e) {
                    $this->command->warn('  - CCCD render: '.$e->getMessage());
                }
            }
        }

        // --- Generate Physical Contract Document ---
        try {
            $docPath = app(ContractDocumentService::class)->generateDocument($contract);
            $contract->update([
                'document_path' => $docPath,
                'document_type' => 'PDF',
                'signed_at' => $startDate,
            ]);
        } catch (\Exception $e) {
            $this->command->warn('  - Could not generate contract document: '.$e->getMessage());
        }

        // --- Invoicing Logic ---
        $tempDate = $startDate->copy();
        $isFirstInvoice = true;
        $skipFinalCalendarMonthForTerminationRefundDemo = $isDemoTermination;

        while ($tempDate->lte($endDate) && $tempDate->lte($cutoffLimit)) {
            if ($skipFinalCalendarMonthForTerminationRefundDemo && $tempDate->gte($endDate->copy()->startOfMonth())) {
                break;
            }

            $invoiceDate = $tempDate->copy()->addDays(rand(0, 5));
            if ($invoiceDate->gt($cutoffLimit)) {
                break;
            }

            $invoice = Invoice::create([
                'id' => Str::uuid()->toString(),
                'org_id' => $org->id,
                'property_id' => $room->property_id,
                'contract_id' => $contract->id,
                'room_id' => $room->id,
                'status' => 'ISSUED',  // Luôn bắt đầu ISSUED — Payment+Receipt mới set PAID
                'issue_date' => $invoiceDate,
                'due_date' => $invoiceDate->copy()->addDays(7),
                'period_start' => $tempDate->copy()->startOfMonth(),
                'period_end' => $tempDate->copy()->endOfMonth(),
                'total_amount' => 0,
                'paid_amount' => 0,
                'created_by_user_id' => $ownerId,
                'snapshot' => $isFirstInvoice ? ['is_initial' => true] : null,
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

            if (! $isFirstInvoice && $tempDate->gt($startDate)) {
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
                // FIXED VALUES FOR JAN, FEB, MAR 2026
                $month = $tempDate->month;
                $usage = 0;

                if ($m['config']['type'] === 'ELECTRIC') {
                    $usage = [
                        10 => 145, 11 => 155, 12 => 148,
                        1 => 150, 2 => 130, 3 => 140,
                    ][$month] ?? 100;
                } else {
                    $usage = [
                        10 => 11, 11 => 12, 12 => 11,
                        1 => 12, 2 => 13, 3 => 14,
                    ][$month] ?? 10;
                }

                $newValue = $m['last_value'] + $usage;
                $readingId = Str::uuid()->toString();

                $reading = $readingService->create([
                    'org_id' => $org->id,
                    'meter_id' => $m['id'],
                    'period_start' => $pStart->toDateString(),
                    'period_end' => $pEnd->toDateString(),
                    'reading_value' => $newValue,
                    'consumption' => $usage,
                    'status' => 'APPROVED', // Tự động duyệt để dễ xem
                    'submitted_by_user_id' => $propertyStaffId,
                    'submitted_at' => $pEnd->copy()->addDay(),
                    'approved_at' => $pEnd->copy()->addDay(),
                ]);

                // Sync media based on month and type
                $typeLower = strtolower($m['config']['type']);
                $imgPath = database_path("data/meters/{$typeLower}_month_{$month}.png");
                if (file_exists($imgPath)) {
                    $reading->addMedia($imgPath)
                        ->preservingOriginal()
                        ->toMediaCollection('reading_proofs');
                }

                $m['last_value'] = $newValue;

                // Approve and Lock because invoice is issued (skip broadcasting during seeding)
                $readingService->update($reading, ['status' => 'LOCKED'], false);

                // Aggregate to property monthly total
                $monthKey = $tempDate->toDateString();
                $propertyMonthlyUsage[$monthKey][$m['config']['type']] = ($propertyMonthlyUsage[$monthKey][$m['config']['type']] ?? 0) + $usage;

                InvoiceItem::create([
                    'id' => Str::uuid()->toString(),
                    'org_id' => $org->id,
                    'invoice_id' => $invoice->id,
                    'description' => 'Tiền '.$m['config']['type'],
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
                'paid_amount' => 0,
            ]);

            // --- Generate Physical Invoice PDF ---
            try {
                app(InvoicePdfService::class)->generate($invoice);
            } catch (\Exception $e) {
                $this->command->warn('  - Could not generate invoice PDF: '.$e->getMessage());
            }

            // --- Quyết định trạng thái cuối theo đúng luồng nghiệp vụ ---
            // Tháng cũ (trước tháng hiện tại) hoặc HĐ kết thúc → tạo Payment + Receipt → rồi mới PAID
            // Tháng hiện tại quá due_date mà chưa trả → OVERDUE
            // Tháng hiện tại chưa đến hạn → giữ ISSUED
            $tenantMember = $contract->members()->where('role', 'TENANT')->first();
            $payerUserId = $tenantMember?->user_id ?? $ownerId;

            $due = $invoice->due_date ? Carbon::parse($invoice->due_date) : null;
            $isPastDue = $due && $due->isPast();

            if ($isEndedLike || $tempDate->lt(now()->startOfMonth())) {
                // Tháng cũ hoặc HĐ kết thúc: Payment + Receipt → PAID
                $this->seedPaymentAndReceipt($invoice, $org, $ownerId, $payerUserId);
            } elseif ($isPastDue) {
                // Tháng hiện tại nhưng đã qua due_date → OVERDUE
                $invoice->update(['status' => 'OVERDUE']);
            }
            // else: giữ nguyên ISSUED (tháng hiện tại, chưa đến hạn)

            $tempDate->addMonths(1);
        }

        if ($skipFinalCalendarMonthForTerminationRefundDemo) {
            $this->seedFinalMonthMeterReadingsForTerminationDemo(
                $org,
                $meters,
                $propertyStaffId,
                $endDate,
                $propertyMonthlyUsage,
                $readingService
            );

            // Sau khi $meters[*]['last_value'] được cập nhật theo MeterReading thật của tháng kết thúc,
            // mới tạo HandoverMeterSnapshot cho OUT handover — số liệu khớp pipeline thật.
            $this->attachOutHandoverMeterSnapshotsFromCurrent($contract, $meters);
        }

        $this->applySeedUnpaidRentTail($contract, $fixedPrimaryTenant, $status, $org, $ownerId);

        // HĐ demo thanh lý (501): không seedTerminationFinalInvoiceAndReconcile — tránh hóa đơn is_termination;
        // demo thanh lý chạy tay qua UI trên HĐ ACTIVE có nợ tháng 3/2026 (Vũ Minh Hiếu, Nguyễn Đình Tuấn).
        if (! $isDemoTermination) {
            $this->seedDepositRefundReceiptIfDemo($contract, $fixedPrimaryTenant, $status, $org);
        }

        $this->seedContractTimeline($contract->fresh(), $ownerId, $startDate, $endDate, $effectiveStatus, $isDemoTermination);

        return $contract;
    }

    /**
     * Chỉ số đồng hồ tháng kết thúc (tháng chứa end_date) — dùng cho hóa đơn thanh lý, tránh trùng hóa đơn kỳ thường.
     */
    private function seedFinalMonthMeterReadingsForTerminationDemo(
        Org $org,
        array &$meters,
        string $propertyStaffId,
        Carbon $endDate,
        array &$propertyMonthlyUsage,
        MeterReadingService $readingService,
    ): void {
        $tempDate = $endDate->copy()->startOfMonth();
        $pStart = $tempDate->copy()->startOfMonth();
        $pEnd = $tempDate->copy()->endOfMonth();
        $month = (int) $tempDate->month;

        foreach ($meters as &$m) {
            if ($m['config']['type'] === 'ELECTRIC') {
                $usage = [
                    10 => 145, 11 => 155, 12 => 148,
                    1 => 150, 2 => 130, 3 => 140,
                ][$month] ?? 100;
            } else {
                $usage = [
                    10 => 11, 11 => 12, 12 => 11,
                    1 => 12, 2 => 13, 3 => 14,
                ][$month] ?? 10;
            }

            $newValue = $m['last_value'] + $usage;

            $reading = $readingService->create([
                'org_id' => $org->id,
                'meter_id' => $m['id'],
                'period_start' => $pStart->toDateString(),
                'period_end' => $pEnd->toDateString(),
                'reading_value' => $newValue,
                'consumption' => $usage,
                'status' => 'APPROVED',
                'submitted_by_user_id' => $propertyStaffId,
                'submitted_at' => $pEnd->copy()->addDay(),
                'approved_at' => $pEnd->copy()->addDay(),
            ]);

            $typeLower = strtolower($m['config']['type']);
            $imgPath = database_path("data/meters/{$typeLower}_month_{$month}.png");
            if (file_exists($imgPath)) {
                $reading->addMedia($imgPath)
                    ->preservingOriginal()
                    ->toMediaCollection('reading_proofs');
            }

            $m['last_value'] = $newValue;

            $readingService->update($reading, ['status' => 'LOCKED'], false);

            $monthKey = $tempDate->toDateString();
            $propertyMonthlyUsage[$monthKey][$m['config']['type']] = ($propertyMonthlyUsage[$monthKey][$m['config']['type']] ?? 0) + $usage;
        }
        unset($m);
    }

    /**
     * Hóa đơn quyết toán thanh lý (is_termination) + FIFO cấn trừ cọc — sinh RefundReceipt / FPR như luồng EDA thật.
     * (Hiện không gọi từ seed phòng 501 — giữ method nếu cần tái bật hoặc tham chiếu.)
     */
    private function seedTerminationFinalInvoiceAndReconcile(Contract $contract, string $ownerId, Carbon $endDate): void
    {
        try {
            if (Invoice::query()
                ->where('contract_id', $contract->id)
                ->where('is_termination', true)
                ->exists()) {
                return;
            }

            $contractService = app(ContractService::class);
            $invoiceService = app(InvoiceService::class);
            $terminationDate = $endDate->toDateString();

            $items = $contractService->buildTerminationPipelineInvoiceItems(
                $contract->fresh(),
                $terminationDate,
                [
                    'penalty_amount' => 0,
                    'damage_fee_total' => 0,
                ]
            );

            $invoice = $invoiceService->create([
                'org_id' => $contract->org_id,
                'property_id' => $contract->property_id,
                'room_id' => $contract->room_id,
                'contract_id' => $contract->id,
                'status' => 'DRAFT',
                'issue_date' => $terminationDate,
                'due_date' => $terminationDate,
                'period_start' => $terminationDate,
                'period_end' => $terminationDate,
                'is_termination' => true,
                'snapshot' => [
                    'is_termination' => true,
                    'pipeline' => 'org_seed_demo',
                    'seed_demo' => true,
                ],
                'created_by_user_id' => $ownerId,
            ], $items);

            $invoiceService->issueInvoice(
                $invoice->fresh(),
                $ownerId,
                'OrgSeeder — phát hành hóa đơn quyết toán thanh lý (demo Đỗ Minh Đức).'
            );

            try {
                app(InvoicePdfService::class)->generate($invoice->fresh());
            } catch (\Throwable $e) {
                $this->command->warn('  - PDF hóa đơn thanh lý demo: '.$e->getMessage());
            }

            app(TerminationReconciliationService::class)->reconcile($contract->fresh(), $invoice->fresh());

            $settled = $contract->fresh();
            $meta = $settled->meta ?? [];
            $termination = is_array($meta['termination_settlement'] ?? null) ? $meta['termination_settlement'] : [];
            $meta['termination_settlement'] = array_merge($termination, ['seed_demo' => true]);
            $settled->update(['meta' => $meta]);

            // Đúng pipeline EDA: hóa đơn thanh lý PAID nhờ applyDepositCreditTowardInvoice (paid_amount tăng) —
            // KHÔNG tạo Payment / Receipt PDF cho phần cấn trừ cọc. Tab "Biên lai" của BQL chỉ thấy biên lai cho các kỳ thường đã có Payment.
            $contractForReceipts = $settled->fresh();
            $this->seedDemoTerminationRefundReceiptPaidWithPdf($contractForReceipts, $ownerId, $endDate);

            $this->command->line('  └─ <fg=green>Đã seed hóa đơn thanh lý + quyết toán cọc (EDA)</> (HĐ demo kết thúc).');
        } catch (\Throwable $e) {
            $this->command->warn('  - seedTerminationFinalInvoiceAndReconcile: '.$e->getMessage());
        }
    }

    /**
     * Backfill contract_status_histories cho mỗi hợp đồng demo: do `DatabaseSeeder` chạy với
     * `WithoutModelEvents`, observer `ContractObserver` không kích hoạt → bảng timeline trống.
     * Hàm này chèn thẳng các milestone (CONTRACT_CREATED, SIGNATURE, STATUS_CHANGE, …) qua DB
     * facade, kèm timestamp rải đều giữa start_date và end_date để timeline trông tự nhiên.
     *
     * Đỗ Minh Đức (demo termination) sẽ có thêm chuỗi: handover → final invoice → reconcile →
     * (kịch B: TERMINATED + SETTLEMENT_PAYMENT_REQUESTED; kịch A/C: SETTLEMENT_RESOLVED) — không còn
     * bước STATUS PENDING_SETTLEMENT (luồng cũ đã bỏ trên bản ghi hợp đồng).
     */
    private function seedContractTimeline(
        Contract $contract,
        string $ownerId,
        Carbon $startDate,
        Carbon $endDate,
        string $effectiveStatus,
        bool $isDemoTermination,
    ): void {
        // Reset toàn bộ timeline cũ để tránh trùng (listener thật có thể đã chèn 1 vài dòng
        // khi seedTerminationFinalInvoiceAndReconcile gọi event()).
        DB::table('contract_status_histories')
            ->where('contract_id', $contract->id)
            ->delete();

        $entries = [];

        $signedAt = $startDate->copy()->subDays(7);

        // Mọi hợp đồng đều bắt đầu bằng CONTRACT_CREATED → ký → kích hoạt.
        $entries[] = [
            'event_type' => 'CONTRACT_CREATED',
            'from_status' => null,
            'to_status' => 'DRAFT',
            'notes' => 'Hợp đồng được khởi tạo trên hệ thống.',
            'payload' => null,
            'at' => $startDate->copy()->subDays(14),
        ];

        $entries[] = [
            'event_type' => 'STATUS_CHANGE',
            'from_status' => 'DRAFT',
            'to_status' => 'PENDING_SIGNATURE',
            'notes' => 'Hợp đồng được gửi cho khách ký.',
            'payload' => null,
            'at' => $startDate->copy()->subDays(10),
        ];

        $entries[] = [
            'event_type' => 'SIGNATURE_TENANT',
            'from_status' => 'PENDING_SIGNATURE',
            'to_status' => 'PENDING_SIGNATURE',
            'notes' => 'Khách thuê đã ký xác nhận hợp đồng.',
            'payload' => ['role' => 'tenant'],
            'at' => $signedAt,
        ];

        $entries[] = [
            'event_type' => 'SIGNATURE_MANAGER',
            'from_status' => 'PENDING_SIGNATURE',
            'to_status' => 'PENDING_SIGNATURE',
            'notes' => 'Quản lý đã ký xác nhận hợp đồng.',
            'payload' => ['role' => 'manager'],
            'at' => $signedAt->copy()->addHours(2),
        ];

        $entries[] = [
            'event_type' => 'STATUS_CHANGE',
            'from_status' => 'PENDING_SIGNATURE',
            'to_status' => 'PENDING_PAYMENT',
            'notes' => 'Khách đã ký xác nhận, chờ thanh toán cọc + tiền phòng.',
            'payload' => null,
            'at' => $signedAt->copy()->addHours(3),
        ];

        $entries[] = [
            'event_type' => 'STATUS_CHANGE',
            'from_status' => 'PENDING_PAYMENT',
            'to_status' => 'ACTIVE',
            'notes' => 'Thanh toán được xác nhận. Hợp đồng bắt đầu hiệu lực.',
            'payload' => null,
            'at' => $startDate->copy(),
        ];

        if ($isDemoTermination || $effectiveStatus === ContractStatus::TERMINATED->value) {
            $finalInvoice = Invoice::query()
                ->where('contract_id', $contract->id)
                ->where('is_termination', true)
                ->first();
            $handover = Handover::query()->where('contract_id', $contract->id)->first();
            $refund = RefundReceipt::query()->where('contract_id', $contract->id)->first();
            $terminationMeta = is_array(($contract->meta ?? [])['termination_settlement'] ?? null)
                ? $contract->meta['termination_settlement']
                : [];
            $scenario = $terminationMeta['scenario'] ?? null;
            $fpr = FinalPaymentRequest::query()
                ->where('contract_id', $contract->id)
                ->orderByDesc('created_at')
                ->first();
            $scenarioB = $scenario === 'B'
                || ($scenario === null && $fpr && round((float) $fpr->amount_due, 2) > 0.02);

            $entries[] = [
                'event_type' => 'STATUS_CHANGE',
                'from_status' => 'ACTIVE',
                'to_status' => 'PENDING_TERMINATION',
                'notes' => 'Bắt đầu pipeline thanh lý hợp đồng theo thỏa thuận.',
                'payload' => null,
                'at' => $endDate->copy()->subDays(5),
            ];

            if ($handover) {
                $entries[] = [
                    'event_type' => 'HANDOVER_SUBMITTED',
                    'from_status' => 'PENDING_TERMINATION',
                    'to_status' => 'PENDING_TERMINATION',
                    'notes' => 'Đã hoàn tất biên bản bàn giao trả phòng.',
                    'payload' => ['handover_id' => $handover->id, 'id' => $handover->id],
                    'at' => $endDate->copy()->subDays(3),
                ];
            }

            if ($finalInvoice) {
                $entries[] = [
                    'event_type' => 'FINAL_INVOICE_GENERATED',
                    'from_status' => 'PENDING_TERMINATION',
                    'to_status' => 'PENDING_TERMINATION',
                    'notes' => 'Đã phát hành hóa đơn thanh lý cuối.',
                    'payload' => [
                        'invoice_id' => $finalInvoice->id,
                        'total_amount' => (string) $finalInvoice->total_amount,
                        'id' => $finalInvoice->id,
                    ],
                    'at' => $endDate->copy()->subDays(2),
                ];

                $entries[] = [
                    'event_type' => 'DEBT_RECONCILIATION',
                    'from_status' => 'PENDING_TERMINATION',
                    'to_status' => 'PENDING_TERMINATION',
                    'notes' => 'Bắt đầu cấn trừ tiền cọc theo FIFO với các hóa đơn còn nợ.',
                    'payload' => [
                        'final_invoice_id' => $finalInvoice->id,
                        'id' => $finalInvoice->id,
                    ],
                    'at' => $endDate->copy()->subDays(1),
                ];
            }

            $entries[] = [
                'event_type' => 'STATUS_CHANGE',
                'from_status' => 'PENDING_TERMINATION',
                'to_status' => ContractStatus::TERMINATED->value,
                'notes' => $scenarioB
                    ? 'Kết thúc hợp đồng; còn nợ quyết toán qua yêu cầu thanh toán nốt (FPR).'
                    : 'Hoàn tất quyết toán thanh lý. Hợp đồng kết thúc.',
                'payload' => null,
                'at' => $endDate->copy()->subDays(1)->addHours(2),
            ];

            if ($scenarioB && $fpr) {
                $entries[] = [
                    'event_type' => 'SETTLEMENT_PAYMENT_REQUESTED',
                    'from_status' => ContractStatus::TERMINATED->value,
                    'to_status' => ContractStatus::TERMINATED->value,
                    'notes' => 'Đã sinh yêu cầu thanh toán nốt sau khi cấn trừ cọc.',
                    'payload' => [
                        'final_payment_request_id' => $fpr->id,
                        'amount_due' => (string) $fpr->amount_due,
                        'invoice_id' => $fpr->invoice_id,
                        'id' => $fpr->id,
                    ],
                    'at' => $endDate->copy()->subDays(1)->addHours(3),
                ];
            }

            if (! $scenarioB) {
                $entries[] = [
                    'event_type' => 'SETTLEMENT_RESOLVED',
                    'from_status' => ContractStatus::TERMINATED->value,
                    'to_status' => ContractStatus::TERMINATED->value,
                    'notes' => $refund
                        ? 'Đã quyết toán hoàn cọc cho khách.'
                        : 'Quyết toán thanh lý hoàn tất.',
                    'payload' => array_filter([
                        'refund_receipt_id' => $refund?->id,
                        'settlement_invoice_id' => $finalInvoice?->id,
                        'id' => $refund?->id ?? $finalInvoice?->id ?? $contract->id,
                    ]),
                    'at' => $endDate->copy()->subHours(2),
                ];
            }
        }

        $rows = [];
        foreach ($entries as $entry) {
            /** @var Carbon $at */
            $at = $entry['at'];
            $rows[] = [
                'id' => (string) Str::uuid(),
                'org_id' => $contract->org_id,
                'contract_id' => $contract->id,
                'from_status' => $entry['from_status'],
                'to_status' => $entry['to_status'],
                'event_type' => $entry['event_type'],
                'changed_by_user_id' => $ownerId,
                'notes' => $entry['notes'],
                'payload' => $entry['payload'] ? json_encode($entry['payload'], JSON_UNESCAPED_UNICODE) : null,
                'created_at' => $at->copy(),
                'updated_at' => $at->copy(),
            ];
        }

        if ($rows) {
            DB::table('contract_status_histories')->insert($rows);
        }
    }

    /**
     * Demo: sau khi có RefundReceipt từ reconcile — mô phỏng BQL đã chi hoàn cọc (paid_at + PDF) để tenant / BQL có file ngay sau seed.
     */
    private function seedDemoTerminationRefundReceiptPaidWithPdf(Contract $contract, string $ownerId, Carbon $endDate): void
    {
        $refund = RefundReceipt::query()->where('contract_id', $contract->id)->first();
        if (! $refund || $refund->paid_at) {
            return;
        }

        try {
            $refund->forceFill([
                'paid_at' => $endDate->copy()->endOfDay(),
                'paid_by_user_id' => $ownerId,
                'payout_method' => RefundReceipt::PAYOUT_METHOD_TRANSFER,
                'payout_reference' => 'SEED-DEMO-HOAN-COC',
            ])->save();

            $contract->forceFill([
                'deposit_status' => DepositStatus::REFUNDED,
                'refunded_amount' => (float) $refund->amount,
            ])->save();

            app(ReceiptService::class)->generateForRefundReceipt($refund->fresh());

            $this->command->line('  └─ <fg=green>Đã seed biên lai PDF hoàn cọc + deposit_status REFUNDED (demo)</>.');
        } catch (\Throwable $e) {
            $this->command->warn('  - seedDemoTerminationRefundReceiptPaidWithPdf: '.$e->getMessage());
        }
    }

    /**
     * Fallback: RefundReceipt tay (không qua reconcile). HĐ demo phòng 501 không còn gọi reconcile trong seed.
     */
    private function seedDepositRefundReceiptIfDemo(
        Contract $contract,
        ?array $fixedPrimaryTenant,
        string $status,
        Org $org,
    ): void {
        if ($status !== ContractStatus::TERMINATED->value || ! ($fixedPrimaryTenant['seed_deposit_refund_demo'] ?? false)) {
            return;
        }

        $amount = (float) $contract->deposit_amount;
        if ($amount <= 0) {
            return;
        }

        if (RefundReceipt::query()->where('contract_id', $contract->id)->exists()) {
            return;
        }

        $receipt = RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'amount' => $amount,
            'meta' => [
                'note' => 'OrgSeeder — phiếu hoàn cọc sau kết thúc hợp đồng (demo).',
            ],
        ]);

        $meta = $contract->meta ?? [];
        $termination = is_array($meta['termination_settlement'] ?? null) ? $meta['termination_settlement'] : [];
        $meta['termination_settlement'] = array_merge($termination, [
            'scenario' => 'A',
            'refund_receipt_id' => $receipt->id,
            'refund_amount' => (string) $amount,
            'seed_demo' => true,
        ]);

        $contract->update([
            'refunded_amount' => $amount,
            'deposit_status' => DepositStatus::REFUND_PENDING,
            'meta' => $meta,
        ]);
    }

    /**
     * Demo: tenant nợ có chủ đích — hoặc N kỳ cuối (seed_unpaid_rent_months),
     * hoặc đúng các tháng period_start (seed_unpaid_period_starts, ví dụ 2026-02-01).
     */
    private function applySeedUnpaidRentTail(
        Contract $contract,
        ?array $fixedPrimaryTenant,
        string $status,
        Org $org,
        string $ownerId,
    ): void {
        if (! $fixedPrimaryTenant || $status !== 'ACTIVE') {
            return;
        }

        $periodStarts = $fixedPrimaryTenant['seed_unpaid_period_starts'] ?? null;
        $tail = (int) ($fixedPrimaryTenant['seed_unpaid_rent_months'] ?? 0);
        $useExactPeriods = is_array($periodStarts) && count($periodStarts) > 0;

        if (! $useExactPeriods && $tail < 1) {
            return;
        }

        $invoices = Invoice::where('contract_id', $contract->id)
            ->orderBy('period_start')
            ->get();

        if ($invoices->isEmpty()) {
            return;
        }

        if ($useExactPeriods) {
            $monthKeys = [];
            foreach ($periodStarts as $p) {
                $monthKeys[Carbon::parse((string) $p)->format('Y-m')] = true;
            }
            $unpayInvoices = $invoices->filter(function ($inv) use ($monthKeys) {
                if (! $inv->period_start) {
                    return false;
                }
                $key = Carbon::parse($inv->period_start)->format('Y-m');

                return isset($monthKeys[$key]);
            })->values();
            $unpayIds = $unpayInvoices->pluck('id')->all();
            $payInvoices = $invoices->filter(fn ($inv) => ! in_array($inv->id, $unpayIds, true))->values();
        } else {
            $tail = min($tail, $invoices->count());
            $unpayInvoices = $invoices->slice(-$tail)->values();
            $payInvoices = $invoices->slice(0, -$tail)->values();
        }

        // Hóa đơn nợ: xóa bỏ Payment/Allocation đã được tạo từ main loop (tháng cũ → PAID),
        // rồi đặt lại trạng thái OVERDUE hoặc ISSUED tùy due_date.
        foreach ($unpayInvoices as $inv) {
            // Xóa allocation + payment nếu đã được tạo từ main loop
            foreach (PaymentAllocation::where('invoice_id', $inv->id)->get() as $alloc) {
                $pid = $alloc->payment_id;
                $alloc->delete();
                // Xóa payment nếu không còn allocation nào khác
                if ($pid && PaymentAllocation::where('payment_id', $pid)->doesntExist()) {
                    Payment::where('id', $pid)->delete();
                }
            }

            $due = $inv->due_date ? Carbon::parse($inv->due_date) : null;
            $newStatus = ($due && $due->isPast()) ? 'OVERDUE' : 'ISSUED';
            $inv->update(['status' => $newStatus, 'paid_amount' => 0]);
        }

        // Hóa đơn đã thanh toán: đảm bảo có Payment + Receipt (phòng hờ edge case)
        $tenantMember = $contract->members()->where('role', 'TENANT')->first();
        $payerUserId = $tenantMember?->user_id ?? $ownerId;

        foreach ($payInvoices as $inv) {
            if ($inv->status !== 'PAID') {
                $this->seedPaymentAndReceipt($inv, $org, $ownerId, $payerUserId);
            }
        }
    }

    /**
     * Create Handover, Items and Meter Snapshots for a contract
     */
    /**
     * Tạo Payment (APPROVED) + PaymentAllocation + Ledger + Receipt,
     * sau đó mới cập nhật Invoice sang PAID.
     * Đây là thứ tự đúng nghiệp vụ: Payment/Receipt phải tồn tại trước khi Invoice = PAID.
     */
    private function seedPaymentAndReceipt(
        Invoice $invoice,
        Org $org,
        string $ownerId,
        ?string $payerUserId = null
    ): void {
        $total = (float) $invoice->total_amount;
        if ($total <= 0) {
            return;
        }
        // Guard: đã có allocation → đã PAID rồi, bỏ qua
        if (PaymentAllocation::where('invoice_id', $invoice->id)->exists()) {
            return;
        }

        try {
            $payment = Payment::create([
                'id' => (string) Str::uuid(),
                'org_id' => $org->id,
                'property_id' => $invoice->property_id,
                'payer_user_id' => $payerUserId ?? $ownerId,
                'received_by_user_id' => $ownerId,
                'method' => 'CASH',
                'amount' => $total,
                'reference' => 'SEED-'.Str::substr((string) $invoice->id, 0, 8),
                'note' => 'OrgSeeder — thanh toán demo theo hóa đơn',
                'received_at' => $invoice->issue_date,
                'status' => 'APPROVED',
                'approved_by_user_id' => $ownerId,
                'approved_at' => $invoice->issue_date,
            ]);

            PaymentAllocation::create([
                'id' => (string) Str::uuid(),
                'org_id' => $org->id,
                'payment_id' => $payment->id,
                'invoice_id' => $invoice->id,
                'amount' => $total,
            ]);

            // Sổ cái kép (giống RecordPaymentLedger listener)
            $this->seedLedgerForPaymentIfMissing($payment);

            // Biên lai PDF
            app(ReceiptService::class)->generateForPayment($payment);

            // CHỈ sau khi Receipt đã tồn tại mới cập nhật Invoice → PAID
            $invoice->update([
                'status' => 'PAID',
                'paid_amount' => $total,
            ]);
        } catch (\Exception $e) {
            $this->command->warn('  - seedPaymentAndReceipt: '.$e->getMessage());
        }
    }

    /**
     * Demo org `test`: HĐ TERMINATED phòng 501 (Đỗ Minh Đức) — phiếu hoàn cọc đã chi + PDF + meta kịch A.
     * Bổ sung sau vòng seed phòng vì `createContractWithInvoices` bỏ qua `seedDepositRefundReceiptIfDemo` khi `isDemoTermination`.
     */
    private function seedDomMinhDuc501TerminationRefundDemo(): void
    {
        $org = Org::query()->where('name', 'test')->first();
        if (! $org) {
            return;
        }

        $contract = Contract::withoutGlobalScope('org_id')
            ->where('org_id', $org->id)
            ->where('status', ContractStatus::TERMINATED)
            ->whereHas('room', fn ($q) => $q->where('code', '501'))
            ->first();

        if (! $contract) {
            return;
        }

        $refund = RefundReceipt::query()->where('contract_id', $contract->id)->first();
        if ($refund?->paid_at) {
            return;
        }

        LedgerEntry::withoutGlobalScope('org_id')
            ->where('org_id', $org->id)
            ->where('ref_type', LedgerEntry::REF_TYPE_TERMINATION_DEPOSIT_FORFEIT)
            ->where('meta->contract_id', $contract->id)
            ->delete();

        $owner = User::query()
            ->where('org_id', $org->id)
            ->whereHas('roles', fn ($q) => $q->where('name', 'Owner'))
            ->orderBy('created_at')
            ->first();
        $ownerId = $owner?->id ?? $contract->created_by_user_id;
        if (! $ownerId) {
            $this->command->warn('  - seedDomMinhDuc501TerminationRefundDemo: không tìm thấy Owner để gán paid_by.');

            return;
        }

        $paidAt = $contract->terminated_at ?? $contract->end_date ?? now();

        if (! $refund) {
            $amount = round(max(0.0, (float) $contract->deposit_amount), 2);
            if ($amount <= 0.02) {
                return;
            }

            $refund = RefundReceipt::create([
                'org_id' => $org->id,
                'contract_id' => $contract->id,
                'amount' => $amount,
                'meta' => [
                    'note' => 'OrgSeeder — phiếu hoàn cọc sau quyết toán (demo Đỗ Minh Đức, phòng 501).',
                    'seed_demo' => true,
                ],
            ]);

            $meta = is_array($contract->meta ?? null) ? $contract->meta : [];
            $termination = is_array($meta['termination_settlement'] ?? null) ? $meta['termination_settlement'] : [];
            $meta['termination_settlement'] = array_merge($termination, [
                'scenario' => 'A',
                'refund_receipt_id' => $refund->id,
                'refund_amount' => (string) $amount,
                'seed_demo' => true,
            ]);

            $contract->forceFill([
                'refunded_amount' => $amount,
                'forfeited_amount' => 0,
                'deposit_status' => DepositStatus::REFUND_PENDING,
                'meta' => $meta,
            ])->save();
        }

        $refund = RefundReceipt::query()->where('contract_id', $contract->id)->first();
        if (! $refund) {
            return;
        }

        try {
            $refund->forceFill([
                'paid_at' => Carbon::parse($paidAt)->endOfDay(),
                'paid_by_user_id' => $ownerId,
                'payout_method' => RefundReceipt::PAYOUT_METHOD_TRANSFER,
                'payout_reference' => 'SEED-DEMO-HOAN-COC-501',
            ])->save();

            $contract->refresh();
            $meta = is_array($contract->meta ?? null) ? $contract->meta : [];
            $termination = is_array($meta['termination_settlement'] ?? null) ? $meta['termination_settlement'] : [];
            $meta['termination_settlement'] = array_merge($termination, [
                'scenario' => 'A',
                'refund_receipt_id' => $refund->id,
                'refund_amount' => (string) $refund->amount,
                'seed_demo' => true,
            ]);

            $contract->forceFill([
                'deposit_status' => DepositStatus::REFUNDED,
                'refunded_amount' => (float) $refund->amount,
                'forfeited_amount' => 0,
                'meta' => $meta,
            ])->save();

            app(ReceiptService::class)->generateForRefundReceipt($refund->fresh());

            $this->command->line('  └─ <fg=green>Đã seed phiếu hoàn cọc đã chi + PDF (demo Đỗ Minh Đức — phòng 501)</>.');
        } catch (\Throwable $e) {
            $this->command->warn('  - seedDomMinhDuc501TerminationRefundDemo: '.$e->getMessage());
        }
    }

    /**
     * Ghi sổ cái kép giống RecordPaymentLedger khi queue chưa chạy (database/redis).
     */
    private function seedLedgerForPaymentIfMissing(Payment $payment): void
    {
        $existing = LedgerEntry::withoutGlobalScope('org_id')
            ->where('ref_type', 'payment')
            ->where('ref_id', $payment->id)
            ->count();
        if ($existing > 0) {
            return;
        }
        try {
            app(LedgerService::class)->recordPayment($payment);
        } catch (\Throwable $e) {
            $this->command->warn('  - Ledger (seed fallback): '.$e->getMessage());
        }
    }

    /**
     * Tạo Handover (IN/OUT) + items từ RoomAsset.
     *
     * @param  bool  $withMeterSnapshots  Khi false, KHÔNG tạo HandoverMeterSnapshot ngay — caller cần gọi
     *                                    `attachOutHandoverMeterSnapshotsFromCurrent()` sau khi đã có MeterReading
     *                                    tháng cuối để snapshot khớp số đồng hồ thật (HĐ demo Đỗ Minh Đức).
     */
    private function createHandoverForContract($contract, $type, $date, bool $withMeterSnapshots = true)
    {
        $handover = Handover::create([
            'id' => Str::uuid()->toString(),
            'org_id' => $contract->org_id,
            'contract_id' => $contract->id,
            'room_id' => $contract->room_id,
            'created_by_user_id' => $contract->created_by_user_id,
            'note' => $type === 'IN' ? 'Bàn giao nhận phòng' : 'Bàn giao trả phòng',
        ]);

        // Create Handover Items from Room Assets
        $assets = $contract->room->assets;
        foreach ($assets as $index => $asset) {
            HandoverItem::create([
                'id' => Str::uuid()->toString(),
                'org_id' => $contract->org_id,
                'handover_id' => $handover->id,
                'room_asset_id' => $asset->id,
                'name' => $asset->name,
                'condition' => 'OK',
                'sort_order' => $index,
            ]);
        }

        if (! $withMeterSnapshots) {
            return;
        }

        // Create Handover Meter Snapshots from Room Meters (mock — dùng cho HĐ ENDED không-demo)
        $meters = $contract->room->meters;
        foreach ($meters as $meter) {
            $baseReading = 100; // Mock base
            $readingValue = $type === 'IN' ? $baseReading : $baseReading + rand(50, 200);

            HandoverMeterSnapshot::create([
                'id' => Str::uuid()->toString(),
                'org_id' => $contract->org_id,
                'handover_id' => $handover->id,
                'meter_id' => $meter->id,
                'reading_value' => $readingValue,
            ]);
        }
    }

    /**
     * Gắn HandoverMeterSnapshot cho OUT handover của HĐ thanh lý demo, dùng `last_value` thực tế của
     * `$meters` (sau khi `seedFinalMonthMeterReadingsForTerminationDemo` đã chạy và cập nhật last_value).
     * Nhờ vậy snapshot khớp đúng MeterReading được dùng để tính utility trong hóa đơn thanh lý.
     *
     * @param  array<int, array{id: string, last_value: float|int|string, ...}>  $meters
     */
    private function attachOutHandoverMeterSnapshotsFromCurrent(Contract $contract, array $meters): void
    {
        $handover = Handover::query()
            ->where('contract_id', $contract->id)
            ->orderByDesc('created_at')
            ->first();

        if (! $handover) {
            return;
        }

        if (HandoverMeterSnapshot::query()->where('handover_id', $handover->id)->exists()) {
            return;
        }

        foreach ($meters as $meter) {
            $meterId = $meter['id'] ?? null;
            if (! $meterId) {
                continue;
            }

            HandoverMeterSnapshot::create([
                'id' => Str::uuid()->toString(),
                'org_id' => $contract->org_id,
                'handover_id' => $handover->id,
                'meter_id' => $meterId,
                'reading_value' => (float) ($meter['last_value'] ?? 0),
            ]);
        }
    }

    private function resolveCccdTemplateFrontPath(): ?string
    {
        $candidates = [
            database_path('data/identity/cccd_front.png'),
            dirname(base_path()).DIRECTORY_SEPARATOR.'mặt trước CC.png',
        ];
        foreach ($candidates as $path) {
            if ($path && is_readable($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Resolve local room sample images and group them by template index.
     * Supports names like "phòng 1 ảnh 1.jpg", "phong_2_anh_3.png", "room_3_1.webp".
     *
     * @return array<int, array<int, string>>
     */
    private function resolveRoomTemplateImageGroups(): array
    {
        $directories = [
            base_path(),
            dirname(base_path()),
            database_path('data/rooms'),
            database_path('data'),
        ];

        $groups = [];

        foreach ($directories as $dir) {
            if (! is_dir($dir)) {
                continue;
            }

            $files = File::files($dir);
            foreach ($files as $file) {
                $ext = strtolower($file->getExtension());
                if (! in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) {
                    continue;
                }

                $baseName = $file->getFilename();
                $normalized = $this->normalizeAscii($baseName);

                preg_match_all('/\d+/', $normalized, $matches);
                $numbers = array_map('intval', $matches[0] ?? []);
                if (count($numbers) < 2) {
                    continue;
                }

                $templateIndex = $numbers[0];
                $imageIndex = $numbers[1];
                if ($templateIndex <= 0 || $imageIndex <= 0) {
                    continue;
                }

                $groups[$templateIndex][$imageIndex] = $file->getPathname();
            }
        }

        foreach ($groups as $templateIndex => $images) {
            ksort($images);
            $groups[$templateIndex] = array_values($images);
        }

        ksort($groups);

        return $groups;
    }

    private function normalizeAscii(string $value): string
    {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        $normalized = strtolower($ascii !== false ? $ascii : $value);

        return preg_replace('/\s+/', ' ', $normalized) ?? $normalized;
    }

    private function resolveCccdTemplateBackPath(): ?string
    {
        $candidates = [
            database_path('data/identity/cccd_back.png'),
            dirname(base_path()).DIRECTORY_SEPARATOR.'mặt sau CC.png',
        ];
        foreach ($candidates as $path) {
            if ($path && is_readable($path)) {
                return $path;
            }
        }

        return null;
    }
}
