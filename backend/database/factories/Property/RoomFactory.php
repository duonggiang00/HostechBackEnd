<?php

namespace Database\Factories\Property;

use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use App\Models\Property\RoomPrice;
use App\Models\Property\RoomStatusHistory;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RoomFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'org_id' => null,
            'property_id' => null,
            'floor_id' => null,
            'code' => strtoupper(fake()->lexify('?')).str_pad(fake()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'name' => 'Room '.fake()->numberBetween(101, 999),
            'area' => fake()->numberBetween(20, 150),
            'floor_number' => fake()->numberBetween(1, 20),
            'capacity' => fake()->numberBetween(1, 6),
            'base_price' => fake()->numberBetween(30, 150) * 100000,
            'status' => 'available',
            'description' => fake('vi_VN')->realText(50),
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (Room $room) {
            // Cần đảm bảo room có org_id trước khi tạo relations
            if (! $room->org_id) {
                return;
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
                    'serial' => strtoupper(fake()->lexify('???')).fake()->numberBetween(1000, 9999),
                    'condition' => fake()->randomElement(['Mới', 'Tốt', 'Khá', 'Cần sửa chữa']),
                    'purchased_at' => fake()->dateTimeBetween('-3 years', 'now')->format('Y-m-d'),
                    'warranty_end' => fake()->dateTimeBetween('now', '+2 years')->format('Y-m-d'),
                ]);
            }

            // Update description with structured text
            $assetList = !empty($assetsToCreate) ? implode(', ', $assetsToCreate) : 'cơ bản';
            $description = "Phòng tầng {$room->floor_number}, rộng {$room->area} m2 cho {$room->capacity} người ở, có sẵn {$assetList}";
            $room->update(['description' => $description]);

            // Sinh Price history (1 base price records based on room base_price)
            RoomPrice::create([
                'id' => Str::uuid(),
                'org_id' => $room->org_id,
                'room_id' => $room->id,
                'effective_from' => Carbon::now()->startOfMonth()->format('Y-m-d'),
                'price' => $room->base_price,
            ]);

            // Sinh Room Status History (Trạng thái khởi tạo)
            RoomStatusHistory::create([
                'id' => Str::uuid(),
                'org_id' => $room->org_id,
                'room_id' => $room->id,
                'from_status' => null,
                'to_status' => $room->status,
                'reason' => 'Initial status setup',
                'changed_by_user_id' => null,
            ]);
        });
    }
}
