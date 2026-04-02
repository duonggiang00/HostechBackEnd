<?php

namespace Database\Seeders;

use App\Features\Contract\Models\Contract;
use App\Features\Property\Models\Room;
use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Features\Ticket\Models\Ticket;
use App\Features\Ticket\Models\TicketCost;
use App\Features\Ticket\Models\TicketEvent;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TicketSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info("\n================================");
        $this->command->info('🎫 SEED DỮ LIỆU TICKET');
        $this->command->info("================================\n");

        // Lấy org đầu tiên có đủ dữ liệu
        $org = Org::first();

        if (! $org) {
            $this->command->error('❌ Không tìm thấy Org. Hãy chạy OrgSeeder trước.');

            return;
        }

        $owner = User::where('org_id', $org->id)->role('Owner')->first();
        $manager = User::where('org_id', $org->id)->role('Manager')->first();
        $staff = User::where('org_id', $org->id)->role('Staff')->first();
        $tenants = User::where('org_id', $org->id)->role('Tenant')->get();

        if (! $owner || ! $staff || $tenants->isEmpty()) {
            $this->command->error('❌ Thiếu người dùng trong Org. Hãy chạy OrgSeeder trước.');

            return;
        }

        $rooms = Room::where('org_id', $org->id)->limit(10)->get();

        if ($rooms->isEmpty()) {
            $this->command->error('❌ Không tìm thấy phòng. Hãy chạy OrgSeeder trước.');

            return;
        }

        $this->command->line("📌 Org: <fg=yellow>{$org->name}</>");
        $this->command->line("👤 Owner: {$owner->email}");
        $this->command->line("🔧 Staff: {$staff->email}\n");

        // ─────────────────────────────────────────────
        // Danh sách dữ liệu mẫu thực tế
        // ─────────────────────────────────────────────
        $samples = [
            [
                'category' => 'Điện',
                'priority' => 'HIGH',
                'status' => 'DONE',
                'description' => 'Bóng đèn hành lang tầng 2 bị cháy, cần thay mới gấp vì tối không nhìn thấy đường.',
                'created_by' => 'tenant',
                'assigned_to' => 'staff',
                'due_days' => -5,
                'closed' => true,
                'events' => [
                    ['type' => 'RECEIVED', 'actor' => 'staff', 'msg' => 'Đã ghi nhận. Sẽ kiểm tra trong chiều hôm nay.'],
                    ['type' => 'STATUS_CHANGED', 'actor' => 'staff', 'msg' => 'Đang mua bóng đèn thay thế.', 'status' => 'IN_PROGRESS'],
                    ['type' => 'COMMENT', 'actor' => 'tenant', 'msg' => 'Cảm ơn anh, tối hôm qua trơn lắm không đi được.'],
                    ['type' => 'STATUS_CHANGED', 'actor' => 'staff', 'msg' => 'Đã thay bóng đèn mới, hoàn thành.', 'status' => 'DONE'],
                ],
                'costs' => [
                    ['amount' => 45000, 'payer' => 'OWNER', 'note' => 'Tiền mua bóng đèn LED 9W'],
                ],
            ],
            [
                'category' => 'Nước',
                'priority' => 'URGENT',
                'status' => 'IN_PROGRESS',
                'description' => 'Vòi nước nhà bếp bị rỉ nước liên tục từ đêm qua, sàn nhà bị ẩm ướt, nguy cơ trơn trượt.',
                'created_by' => 'tenant',
                'assigned_to' => 'staff',
                'due_days' => 1,
                'closed' => false,
                'events' => [
                    ['type' => 'RECEIVED', 'actor' => 'owner', 'msg' => 'Đã tiếp nhận. Cử thợ xuống kiểm tra.'],
                    ['type' => 'STATUS_CHANGED', 'actor' => 'staff', 'msg' => 'Thợ đang kiểm tra, cần thay ron vòi.', 'status' => 'IN_PROGRESS'],
                    ['type' => 'COMMENT', 'actor' => 'staff', 'msg' => 'Cần đặt ron đặc biệt, mai mới có hàng.'],
                ],
                'costs' => [],
            ],
            [
                'category' => 'Cơ sở vật chất',
                'priority' => 'MEDIUM',
                'status' => 'OPEN',
                'description' => 'Cửa phòng bị kẹt, khó đóng mở, có thể do bản lề bị lỏng.',
                'created_by' => 'tenant',
                'assigned_to' => null,
                'due_days' => 5,
                'closed' => false,
                'events' => [],
                'costs' => [],
            ],
            [
                'category' => 'Điện',
                'priority' => 'URGENT',
                'status' => 'WAITING_PARTS',
                'description' => 'Ổ cắm điện phòng khách bị chập, có mùi khét và tia lửa điện nhỏ khi cắm thiết bị vào.',
                'created_by' => 'tenant',
                'assigned_to' => 'staff',
                'due_days' => 0,
                'closed' => false,
                'events' => [
                    ['type' => 'RECEIVED', 'actor' => 'manager', 'msg' => 'Khẩn cấp! Yêu cầu tắt ổ cắm này ngay, không sử dụng.'],
                    ['type' => 'STATUS_CHANGED', 'actor' => 'staff', 'msg' => 'Thợ điện đã kiểm tra, cần thay toàn bộ hộp ổ cắm âm tường.', 'status' => 'IN_PROGRESS'],
                    ['type' => 'STATUS_CHANGED', 'actor' => 'staff', 'msg' => 'Đang chờ đặt hộp ổ cắm đúng chuẩn, dự kiến 2 ngày.', 'status' => 'WAITING_PARTS'],
                ],
                'costs' => [
                    ['amount' => 320000, 'payer' => 'OWNER', 'note' => 'Công thợ điện kiểm tra + hộp ổ cắm âm tường'],
                ],
            ],
            [
                'category' => 'An ninh',
                'priority' => 'HIGH',
                'status' => 'RECEIVED',
                'description' => 'Khóa cửa chính bị hỏng, không mở được từ bên ngoài bằng chìa khóa dự phòng.',
                'created_by' => 'tenant',
                'assigned_to' => 'owner',
                'due_days' => 2,
                'closed' => false,
                'events' => [
                    ['type' => 'RECEIVED', 'actor' => 'owner', 'msg' => 'Sẽ cho thợ khóa đến xem trong sáng mai.'],
                ],
                'costs' => [],
            ],
            [
                'category' => 'Vệ sinh',
                'priority' => 'LOW',
                'status' => 'DONE',
                'description' => 'Hệ thống thoát nước sàn nhà tắm bị tắc, nước đọng lại sau mỗi lần tắm.',
                'created_by' => 'tenant',
                'assigned_to' => 'staff',
                'due_days' => -10,
                'closed' => true,
                'events' => [
                    ['type' => 'RECEIVED', 'actor' => 'staff', 'msg' => 'Đã ghi nhận, sẽ thông cống trong tuần này.'],
                    ['type' => 'STATUS_CHANGED', 'actor' => 'staff', 'msg' => 'Đang thông cống tại phòng.', 'status' => 'IN_PROGRESS'],
                    ['type' => 'STATUS_CHANGED', 'actor' => 'staff', 'msg' => 'Đã thông cống xong, thoát nước bình thường.', 'status' => 'DONE'],
                    ['type' => 'COMMENT', 'actor' => 'tenant', 'msg' => 'Cảm ơn anh, ổn rồi ạ!'],
                ],
                'costs' => [
                    ['amount' => 80000, 'payer' => 'TENANT', 'note' => 'Phí thông cống tắc do tóc'],
                ],
            ],
            [
                'category' => 'Cơ sở vật chất',
                'priority' => 'MEDIUM',
                'status' => 'CANCELLED',
                'description' => 'Quạt trần phòng ngủ bị kêu to khi chạy ở tốc độ cao, nghi ngờ bearing bị mòn.',
                'created_by' => 'tenant',
                'assigned_to' => null,
                'due_days' => -15,
                'closed' => true,
                'events' => [
                    ['type' => 'COMMENT', 'actor' => 'tenant', 'msg' => 'Thực ra tự sửa được rồi, thêm dầu vào là hết ạ.'],
                    ['type' => 'STATUS_CHANGED', 'actor' => 'owner', 'msg' => 'Cư dân đã tự xử lý, đóng phiếu.', 'status' => 'CANCELLED'],
                ],
                'costs' => [],
            ],
            [
                'category' => 'Internet',
                'priority' => 'HIGH',
                'status' => 'IN_PROGRESS',
                'description' => 'Mạng internet phòng bị chậm nghiêm trọng từ 3 ngày nay, tốc độ chỉ đạt 1-2 Mbps thay vì 100 Mbps như hợp đồng.',
                'created_by' => 'tenant',
                'assigned_to' => 'staff',
                'due_days' => 1,
                'closed' => false,
                'events' => [
                    ['type' => 'RECEIVED', 'actor' => 'staff', 'msg' => 'Đã ghi nhận, sẽ kiểm tra router tầng 3.'],
                    ['type' => 'STATUS_CHANGED', 'actor' => 'staff', 'msg' => 'Phát hiện dây cáp LAN bị gập đứt, đang đặt dây mới.', 'status' => 'IN_PROGRESS'],
                ],
                'costs' => [],
            ],
            [
                'category' => 'Điện',
                'priority' => 'MEDIUM',
                'status' => 'OPEN',
                'description' => 'Đèn nhà vệ sinh bị chập chờn, bật lên lại tắt ngay, cần kiểm tra dây điện.',
                'created_by' => 'tenant',
                'assigned_to' => null,
                'due_days' => 7,
                'closed' => false,
                'events' => [],
                'costs' => [],
            ],
            [
                'category' => 'Cơ sở vật chất',
                'priority' => 'LOW',
                'status' => 'DONE',
                'description' => 'Tủ quần áo bị gãy bản lề, cánh cửa tủ không thể đóng lại được.',
                'created_by' => 'tenant',
                'assigned_to' => 'staff',
                'due_days' => -20,
                'closed' => true,
                'events' => [
                    ['type' => 'RECEIVED', 'actor' => 'staff', 'msg' => 'Sẽ đến thay bản lề vào chiều mai.'],
                    ['type' => 'STATUS_CHANGED', 'actor' => 'staff', 'msg' => 'Đã thay bản lề mới, tủ đóng mở bình thường.', 'status' => 'DONE'],
                ],
                'costs' => [
                    ['amount' => 25000, 'payer' => 'OWNER', 'note' => '2 bản lề inox 3 inch'],
                ],
            ],
        ];

        $tenant = $tenants->first();

        foreach ($samples as $index => $sample) {
            $room = $rooms->get($index % $rooms->count());

            // Tìm contract active của phòng nếu có
            $contract = Contract::where('room_id', $room->id)
                ->where('status', 'ACTIVE')
                ->first();

            // Xác định người tạo và người được giao
            $createdBy = match ($sample['created_by']) {
                'owner' => $owner,
                'manager' => $manager,
                'staff' => $staff,
                default => $tenant,
            };

            $assignedTo = match ($sample['assigned_to']) {
                'owner' => $owner,
                'manager' => $manager,
                'staff' => $staff,
                default => null,
            };

            $dueAt = $sample['due_days'] !== null
                ? Carbon::now()->addDays($sample['due_days'])
                : null;

            $closedAt = $sample['closed'] ? Carbon::now()->subDays(rand(1, 5)) : null;

            $ticket = Ticket::create([
                'org_id' => $org->id,
                'property_id' => $room->property_id,
                'room_id' => $room->id,
                'contract_id' => $contract?->id,
                'created_by_user_id' => $createdBy->id,
                'assigned_to_user_id' => $assignedTo?->id,
                'category' => $sample['category'],
                'priority' => $sample['priority'],
                'status' => $sample['status'],
                'description' => $sample['description'],
                'due_at' => $dueAt,
                'closed_at' => $closedAt,
            ]);

            // Event CREATED tự động
            TicketEvent::create([
                'org_id' => $org->id,
                'ticket_id' => $ticket->id,
                'actor_user_id' => $createdBy->id,
                'type' => 'CREATED',
                'message' => 'Tạo phiếu yêu cầu mới.',
            ]);

            // Các events tiếp theo
            $eventTime = Carbon::now()->subDays(rand(3, 10));
            foreach ($sample['events'] as $ev) {
                $eventActor = match ($ev['actor']) {
                    'owner' => $owner,
                    'manager' => $manager,
                    'staff' => $staff,
                    default => $tenant,
                };

                $eventTime = $eventTime->addHours(rand(1, 8));

                TicketEvent::create([
                    'org_id' => $org->id,
                    'ticket_id' => $ticket->id,
                    'actor_user_id' => $eventActor->id,
                    'type' => $ev['type'] === 'RECEIVED' ? 'STATUS_CHANGED' : $ev['type'],
                    'message' => $ev['msg'],
                    'meta' => isset($ev['status']) ? ['new_status' => $ev['status']] : null,
                    'created_at' => $eventTime,
                ]);
            }

            // Chi phí
            foreach ($sample['costs'] as $cost) {
                TicketCost::create([
                    'org_id' => $org->id,
                    'ticket_id' => $ticket->id,
                    'amount' => $cost['amount'],
                    'payer' => $cost['payer'],
                    'note' => $cost['note'],
                    'created_by_user_id' => $staff->id,
                ]);
            }

            $eventCount = count($sample['events']) + 1;
            $costCount = count($sample['costs']);
            $this->command->line(
                "  ✅ [{$ticket->priority}] {$sample['category']} - <fg=cyan>{$sample['status']}</> | {$eventCount} events, {$costCount} chi phí"
            );
        }

        $this->command->info("\n🎉 Đã tạo <fg=green>".count($samples)."</> phiếu sự cố thành công!\n");
    }
}
