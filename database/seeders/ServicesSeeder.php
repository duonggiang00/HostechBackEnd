<?php

namespace Database\Seeders;

use App\Models\Org\Org;
use App\Models\Property\Room;
use App\Models\Service\Service;
use App\Models\Service\ServiceRate;
use App\Models\Service\TieredRate;
use App\Models\Service\RoomService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Get Default Org (or first one)
        $org = Org::first();
        if (! $org) {
            $this->command->info('No Organization found. Skipping ServicesSeeder.');
            return;
        }

        $services = [
            [
                'code' => 'DIEN',
                'name' => 'Tiền điện',
                'calc_mode' => 'PER_METER', // Theo chỉ số đồng hồ
                'unit' => 'kwh',
                'price' => 3500, // 3.5k/kwh
            ],
            [
                'code' => 'NUOC',
                'name' => 'Tiền nước',
                'calc_mode' => 'PER_METER', // Theo khối
                'unit' => 'm3',
                'price' => 15000, // 15k/m3
            ],
            [
                'code' => 'INTERNET',
                'name' => 'Internet',
                'calc_mode' => 'PER_ROOM', // Theo phòng
                'unit' => 'month',
                'price' => 100000, // 100k/room
            ],
            [
                'code' => 'QL',
                'name' => 'Phí quản lý',
                'calc_mode' => 'PER_ROOM',
                'unit' => 'month',
                'price' => 50000,
            ],
            [
                'code' => 'GUIXE',
                'name' => 'Gửi xe máy',
                'calc_mode' => 'PER_QUANTITY', // Theo số lượng xe
                'unit' => 'bike',
                'price' => 100000,
            ],
            [
                'code' => 'VS',
                'name' => 'Vệ sinh',
                'calc_mode' => 'PER_ROOM',
                'unit' => 'month',
                'price' => 30000,
            ]
        ];

        // Ensure we collect created service IDs for RoomService assignment
        $serviceIds = [];

        foreach ($services as $data) {
            $price = $data['price'];
            unset($data['price']);

            $data['id'] = Str::uuid()->toString();
            $data['org_id'] = $org->id;
            $data['is_active'] = true;
            $data['is_recurring'] = true;
            $data['created_at'] = now();
            $data['updated_at'] = now();

            // Insert Service
            $serviceId = DB::table('services')->where('org_id', $org->id)->where('code', $data['code'])->value('id');
            
            if (!$serviceId) {
                DB::table('services')->insert($data);
                $serviceId = $data['id'];
            }
            $serviceIds[$data['code']] = $serviceId;

            // Insert Initial Rate
            $exists = DB::table('service_rates')
                ->where('service_id', $serviceId)
                ->where('effective_from', now()->startOfMonth()->toDateString())
                ->exists();

            if (! $exists) {
                $rateId = Str::uuid()->toString();
                DB::table('service_rates')->insert([
                    'id' => $rateId,
                    'org_id' => $org->id,
                    'service_id' => $serviceId,
                    'effective_from' => now()->startOfMonth()->toDateString(), // Áp dụng từ đầu tháng này
                    'price' => $price,
                    'created_at' => now(),
                ]);

                // 2. Generate Tiered Rates for Electricity (DIEN)
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
        }

        // 3. Assign Room Services
        $rooms = Room::where('org_id', $org->id)->get();
        // Base services almost all rooms have
        $baseCodes = ['DIEN', 'NUOC', 'INTERNET', 'QL', 'VS'];

        foreach ($rooms as $room) {
            // Randomly select 3 to 5 base services to assign to this room
            $selectedCodes = fake()->randomElements($baseCodes, fake()->numberBetween(3, 5));
            
            foreach ($selectedCodes as $code) {
                // Ensure room_service doesn't already exist to prevent constraint violation
                $exists = DB::table('room_services')
                    ->where('room_id', $room->id)
                    ->where('service_id', $serviceIds[$code])
                    ->exists();

                if (!$exists) {
                    DB::table('room_services')->insert([
                        'id' => Str::uuid()->toString(),
                        'org_id' => $org->id,
                        'room_id' => $room->id,
                        'service_id' => $serviceIds[$code],
                        'quantity' => 1,
                        'included_units' => ($code === 'INTERNET') ? 1 : 0, // Examples of included
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Randomly add parking (quantity varies)
            if (fake()->boolean(60) && isset($serviceIds['GUIXE'])) { // 60% chance to have parking
                 $exists = DB::table('room_services')
                    ->where('room_id', $room->id)
                    ->where('service_id', $serviceIds['GUIXE'])
                    ->exists();
                
                 if (!$exists) {
                     DB::table('room_services')->insert([
                        'id' => Str::uuid()->toString(),
                        'org_id' => $org->id,
                        'room_id' => $room->id,
                        'service_id' => $serviceIds['GUIXE'],
                        'quantity' => fake()->numberBetween(1, 3), // 1-3 bikes
                        'included_units' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                 }
            }
        }

        // 4. Output Summary
        $this->command->info("\n================================");
        $this->command->info('🔧 THỐNG KÊ DỊCH VỤ (SERVICES)');
        $this->command->info('================================');
        $this->command->line("✅ Mã dịch vụ cơ sở (Services): <fg=cyan>" . DB::table('services')->count() . "</>");
        $this->command->line("✅ Bảng giá dịch vụ (Service Rates): <fg=cyan>" . DB::table('service_rates')->count() . "</>");
        $this->command->line("✅ Bảng giá điện bậc thang (Tiered Rates): <fg=cyan>" . DB::table('tiered_rates')->count() . "</>");
        $this->command->line("✅ Dịch vụ gán cho phòng (Room Services): <fg=cyan>" . DB::table('room_services')->count() . "</>\n");
    }
}
