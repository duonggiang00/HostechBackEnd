<?php

namespace Database\Seeders;

use App\Features\Notification\Models\NotificationTemplate;
use App\Features\Org\Models\Org;
use Illuminate\Database\Seeder;

class NotificationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $org = Org::first();

        if (!$org) {
            $this->command->warn('No Org found — skipping NotificationTemplateSeeder.');
            return;
        }

        $templates = [
            [
                'code' => 'meter_reading_submitted',
                'channel' => 'IN_APP',
                'title' => 'Chốt số mới cần duyệt',
                'body' => '📝 {{submitted_by}} đã ghi chỉ số đồng hồ {{meter_code}} (phòng {{room_code}}) — Chờ duyệt.',
                'variables' => ['submitted_by', 'meter_code', 'room_code', 'period_end', 'reading_value'],
            ],
            [
                'code' => 'meter_reading_approved',
                'channel' => 'IN_APP',
                'title' => 'Bản ghi đã được duyệt',
                'body' => '✅ {{approved_by}} đã duyệt chỉ số đồng hồ {{meter_code}} (phòng {{room_code}}).',
                'variables' => ['approved_by', 'meter_code', 'room_code', 'period_end', 'consumption'],
            ],
            [
                'code' => 'meter_reading_rejected',
                'channel' => 'IN_APP',
                'title' => 'Bản ghi bị từ chối',
                'body' => '❌ {{rejected_by}} đã từ chối chỉ số đồng hồ {{meter_code}} (phòng {{room_code}}): {{reason}}.',
                'variables' => ['rejected_by', 'meter_code', 'room_code', 'reason'],
            ],
        ];

        foreach ($templates as $data) {
            NotificationTemplate::updateOrCreate(
                [
                    'org_id' => $org->id,
                    'code' => $data['code'],
                    'channel' => $data['channel'],
                ],
                array_merge($data, ['org_id' => $org->id])
            );
        }

        $this->command->info('✅ Seeded ' . count($templates) . ' default notification templates.');
    }
}
