<?php

namespace Database\Seeders;

use App\Models\Floor;
use App\Models\Org;
use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrgSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info("\n================================");
        $this->command->info('📊 BẮT ĐẦU SEED DỮ LIỆU');
        $this->command->info("================================\n");

        // Create system-wide SuperAdmin
        $this->command->info('👤 Tạo tài khoản Administrator toàn quyền hệ thống...');
        User::factory()->superAdmin()->create([
            'org_id' => null,
        ]);
        $this->command->line("✅ SuperAdmin: admin@example.com (Mật khẩu: 12345678)\n");

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

            User::factory($usersPerOrg)
                ->state(['org_id' => $org->id])
                ->create()
                ->each(function (User $user, $index) {
                    // Assign roles based on user index
                    if ($index === 0) {
                        $user->assignRole('Admin');
                        $user->update(['email' => 'admin.'.fake()->unique()->slug().'@org.example.com']);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=red>Admin</>");
                    } elseif ($index === 1) {
                        $user->assignRole('Owner');
                        $user->update(['email' => 'owner.'.fake()->unique()->slug().'@org.example.com']);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=magenta>Owner</>");
                    } elseif ($index === 2) {
                        $user->assignRole('Manager');
                        $user->update(['email' => 'manager.'.fake()->unique()->slug().'@org.example.com']);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=blue>Manager</>");
                    } elseif ($index === 3) {
                        $user->assignRole('Staff');
                        $user->update(['email' => 'staff.'.fake()->unique()->slug().'@org.example.com']);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=green>Staff</>");
                    } else {
                        $user->assignRole('Tenant');
                        $user->update(['email' => 'tenant.'.fake()->unique()->slug().'@org.example.com']);
                        $this->command->line("  • {$user->full_name} ({$user->email}) - <fg=cyan>Tenant</>");
                    }
                });

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
        });

        $this->command->info("\n================================");
        $this->command->info('📊 TỔNG HỢP DỮ LIỆU ĐÃ SEED');
        $this->command->info('================================');
        $this->command->line('✅ SuperAdmin: <fg=cyan>1</> (admin@example.com 🔓)');
        $this->command->line("✅ Tổ chức: <fg=cyan>$orgCount</>");
        $this->command->line('✅ Tổng người dùng: <fg=cyan>'.($orgCount * $usersPerOrg).'</>');
        $this->command->line('✅ Bất động sản: <fg=cyan>'.($orgCount * $propertiesPerOrg).'</>');
        $this->command->line('✅ Tầng: <fg=cyan>'.($orgCount * $propertiesPerOrg * $floorsPerProperty).'</>');
        $this->command->line('✅ Phòng: <fg=cyan>'.($orgCount * $propertiesPerOrg * (($floorsPerProperty * $roomsPerFloor) + $roomsWithoutFloor))."</>\n");
    }
}
