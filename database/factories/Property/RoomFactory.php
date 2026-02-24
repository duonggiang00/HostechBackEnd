<?php

namespace Database\Factories\Property;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Property\Room;
use App\Models\Property\RoomPhoto;
use App\Models\Property\RoomAsset;
use App\Models\Property\RoomPrice;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use Carbon\Carbon;

class RoomFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'org_id' => null,
            'property_id' => null,
            'floor_id' => null,
            'code' => strtoupper(fake()->lexify('?')) . str_pad(fake()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'name' => 'Room '.fake()->numberBetween(101, 999),
            'type' => fake()->randomElement(['studio', 'apartment', 'house', 'dormitory']),
            'area' => fake()->numberBetween(20, 150),
            'floor' => fake()->numberBetween(1, 20),
            'capacity' => fake()->numberBetween(1, 6),
            'base_price' => fake()->numberBetween(5000000, 50000000),
            'status' => fake()->randomElement(['available', 'occupied', 'maintenance']),
            'description' => fake()->sentence(),
            'amenities' => json_encode(fake()->randomElements(['WiFi', 'AC', 'TV', 'Bed', 'Kitchen'], 3)),
            'utilities' => json_encode(fake()->randomElements(['Electricity', 'Water', 'Gas'], 2)),
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (Room $room) {
            // Cần đảm bảo room có org_id trước khi tạo relations
            if (! $room->org_id) return;

            // Sinh Photos (1-3 ảnh)
            $photoCount = fake()->numberBetween(1, 3);
            for ($i = 0; $i < $photoCount; $i++) {
                RoomPhoto::create([
                    'id' => Str::uuid(),
                    'org_id' => $room->org_id,
                    'room_id' => $room->id,
                    'path' => 'rooms/' . $room->id . '/' . fake()->lexify('?????') . '.jpg',
                    'mime' => 'image/jpeg',
                    'size_bytes' => fake()->numberBetween(100000, 5000000),
                    'sort_order' => $i,
                ]);
            }

            // Sinh Assets (1-4 tài sản)
            $assetNames = ['Điều hòa', 'Tivi', 'Tủ lạnh', 'Máy giặt', 'Bình nóng lạnh', 'Giường', 'Tủ quần áo'];
            $assetsToCreate = fake()->randomElements($assetNames, fake()->numberBetween(1, 4));
            
            foreach ($assetsToCreate as $assetName) {
                RoomAsset::create([
                    'id' => Str::uuid(),
                    'org_id' => $room->org_id,
                    'room_id' => $room->id,
                    'name' => $assetName,
                    'serial' => strtoupper(fake()->lexify('???')) . fake()->numberBetween(1000, 9999),
                    'condition' => fake()->randomElement(['Mới', 'Tốt', 'Khá', 'Cần sửa chữa']),
                    'purchased_at' => fake()->dateTimeBetween('-3 years', 'now')->format('Y-m-d'),
                    'warranty_end' => fake()->dateTimeBetween('now', '+2 years')->format('Y-m-d'),
                ]);
            }

            // Sinh Price history (1 base price records based on room base_price)
            RoomPrice::create([
                'id' => Str::uuid(),
                'org_id' => $room->org_id,
                'room_id' => $room->id,
                'effective_from' => Carbon::now()->startOfMonth()->format('Y-m-d'),
                'price' => $room->base_price,
            ]);

            // Sinh Đồng hồ Điện và Nước (Meters)
            $meterTypes = ['ELECTRIC', 'WATER'];
            foreach ($meterTypes as $type) {
                $meter = Meter::create([
                    'id' => Str::uuid(),
                    'org_id' => $room->org_id,
                    'room_id' => $room->id,
                    'code' => $type === 'ELECTRIC' ? 'E-' . strtoupper(Str::random(6)) : 'W-' . strtoupper(Str::random(6)),
                    'type' => $type,
                    'installed_at' => Carbon::now()->subMonths(6)->format('Y-m-d'),
                    'is_active' => true,
                ]);

                // Sinh Bản ghi chốt số (MeterReadings) - Tháng trước (Đã APPROVED)
                $lastMonthStart = Carbon::now()->subMonth()->startOfMonth();
                MeterReading::create([
                    'id' => Str::uuid(),
                    'org_id' => $room->org_id,
                    'meter_id' => $meter->id,
                    'period_start' => $lastMonthStart->format('Y-m-d'),
                    'period_end' => $lastMonthStart->copy()->endOfMonth()->format('Y-m-d'),
                    'reading_value' => $type === 'ELECTRIC' ? fake()->numberBetween(100, 500) : fake()->numberBetween(10, 50),
                    'status' => 'APPROVED',
                    'approved_at' => $lastMonthStart->copy()->endOfMonth(),
                ]);

                // Sinh Bản ghi chốt số (MeterReadings) - Tháng này (Đang DRAFT)
                $thisMonthStart = Carbon::now()->startOfMonth();
                MeterReading::create([
                    'id' => Str::uuid(),
                    'org_id' => $room->org_id,
                    'meter_id' => $meter->id,
                    'period_start' => $thisMonthStart->format('Y-m-d'),
                    'period_end' => $thisMonthStart->copy()->endOfMonth()->format('Y-m-d'),
                    'reading_value' => fake()->numberBetween(500, 1000), // Số tiếp theo
                    'status' => 'DRAFT',
                ]);
            }
        });
    }
}
