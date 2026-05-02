<?php

namespace App\Http\Requests\Contract;

use App\Enums\ContractStatus;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\System\TemporaryUpload;
use App\Support\ContractMemberAge;
use App\Support\OrgUserPhone;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ContractStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'uuid', Rule::exists('properties', 'id')->whereNull('deleted_at')],
            'room_id' => ['required', 'uuid', Rule::exists('rooms', 'id')->whereNull('deleted_at')],
            'status' => ['nullable', 'string', Rule::in(ContractStatus::values())],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'billing_cycle' => ['nullable', 'integer', 'min:1', 'max:12'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'cutoff_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'rent_price' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'deposit_months' => ['nullable', 'integer', 'min:1', 'max:24'],

            // Member validation — 3 paths:
            // A) user_id provided → link existing account
            // B) email provided (no user_id) → lookup or send invitation
            // C) neither → manual declaration (no account needed)
            'members' => ['required', 'array', 'min:1'],
            'members.*.user_id' => ['nullable', 'uuid', 'distinct', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'members.*.email' => ['nullable', 'email', 'max:255'],
            'members.*.full_name' => ['nullable', 'string', 'max:255'],
            'members.*.phone' => ['nullable', 'string', 'max:20'],
            'members.*.identity_number' => ['nullable', 'string', 'max:50'],
            'members.*.date_of_birth' => ['nullable', 'date'],
            'members.*.license_plate' => ['nullable', 'string', 'max:50'],
            'members.*.permanent_address' => ['nullable', 'string', 'max:500'],
            'members.*.role' => ['nullable', 'string', 'in:TENANT,ROOMMATE,GUARANTOR'],
            'members.*.is_primary' => ['nullable', 'boolean'],
            'members.*.joined_at' => ['nullable', 'date'],
            'members.*.identity_front_media_id' => [
                'nullable',
                'uuid',
                Rule::exists('media', 'uuid')->where('model_type', TemporaryUpload::class),
            ],
            'members.*.identity_back_media_id' => [
                'nullable',
                'uuid',
                Rule::exists('media', 'uuid')->where('model_type', TemporaryUpload::class),
            ],

            'custom_content' => ['nullable', 'string'],
            'meta' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $propertyId = $this->input('property_id');
            $roomId = $this->input('room_id');
            $startDate = $this->input('start_date');
            $endDate = $this->input('end_date');
            $members = $this->input('members', []);
            $dueDay = $this->input('due_day');
            $cutoffDay = $this->input('cutoff_day');

            if ($propertyId && $roomId) {
                $room = Room::query()
                    ->select(['id', 'property_id', 'status', 'capacity'])
                    ->find($roomId);

                if ($room && $room->property_id !== $propertyId) {
                    $validator->errors()->add('room_id', 'Phòng không thuộc bất động sản đã chọn.');
                }

                if ($room && $room->status === 'maintenance') {
                    $validator->errors()->add('room_id', 'Phòng đang bảo trì, không thể tạo hợp đồng mới.');
                }

                if ($room && $room->capacity !== null) {
                    $activeMembersCount = collect($members)->count();
                    if ($activeMembersCount > $room->capacity) {
                        $validator->errors()->add('members', "Số lượng thành viên ({$activeMembersCount}) vượt quá sức chứa tối đa của phòng ({$room->capacity} người).");
                    }
                }
            }

            if ($propertyId && $startDate && $endDate) {
                $effectiveBillingCycle = $this->resolveBillingCycleMonths(
                    $this->input('billing_cycle')
                    ?? Property::query()->whereKey($propertyId)->value('default_billing_cycle')
                    ?? 1
                );

                $minimumEndDate = Carbon::parse($startDate)
                    ->addMonths($effectiveBillingCycle)
                    ->toDateString();

                if (Carbon::parse($endDate)->lt(Carbon::parse($minimumEndDate))) {
                    $validator->errors()->add(
                        'end_date',
                        "Ngày kết thúc không được nhỏ hơn {$minimumEndDate} theo chu kỳ thuê."
                    );
                }
            }

            if (! is_array($members) || $members === []) {
                return;
            }

            $primaryMembers = collect($members)->filter(
                fn (array $member) => filter_var($member['is_primary'] ?? false, FILTER_VALIDATE_BOOLEAN)
            );

            if ($primaryMembers->count() !== 1) {
                $validator->errors()->add('members', 'Hợp đồng phải có đúng 1 người thuê chính.');
            } elseif (($primaryMembers->first()['role'] ?? 'TENANT') !== 'TENANT') {
                $validator->errors()->add('members', 'Người thuê chính phải có vai trò TENANT.');
            }

            $startDateStr = null;
            if ($startDate) {
                try {
                    $startDateStr = Carbon::parse($startDate)->toDateString();
                } catch (\Throwable) {
                    $startDateStr = null;
                }
            }

            if ($startDateStr) {
                $userIdToDobCache = [];

                foreach ($members as $index => $member) {
                    if (! is_array($member)) {
                        continue;
                    }

                    $isPrimary = filter_var($member['is_primary'] ?? false, FILTER_VALIDATE_BOOLEAN);

                    $dob = null;
                    if (! empty($member['date_of_birth'])) {
                        try {
                            $dob = Carbon::parse($member['date_of_birth'])->toDateString();
                        } catch (\Throwable) {
                            $dob = null;
                        }
                    }

                    if ($dob === null && ! empty($member['user_id'])) {
                        $uid = (string) $member['user_id'];
                        if (! array_key_exists($uid, $userIdToDobCache)) {
                            $raw = User::query()->whereKey($uid)->value('date_of_birth');
                            $userIdToDobCache[$uid] = $raw ? Carbon::parse($raw)->toDateString() : null;
                        }
                        $dob = $userIdToDobCache[$uid];
                    }

                    $front = isset($member['identity_front_media_id']) && $member['identity_front_media_id'] !== '' && $member['identity_front_media_id'] !== null
                        ? trim((string) $member['identity_front_media_id'])
                        : null;
                    $back = isset($member['identity_back_media_id']) && $member['identity_back_media_id'] !== '' && $member['identity_back_media_id'] !== null
                        ? trim((string) $member['identity_back_media_id'])
                        : null;
                    $hasF = (bool) $front;
                    $hasB = (bool) $back;

                    if ($hasF xor $hasB) {
                        $validator->errors()->add("members.$index.identity_front_media_id", 'Khi tải CCCD, vui lòng gửi cả mặt trước và mặt sau.');

                        continue;
                    }

                    if ($isPrimary) {
                        if ($dob === null) {
                            $validator->errors()->add("members.$index.date_of_birth", 'Người thuê chính cần có ngày sinh (khai báo hoặc trong tài khoản liên kết).');
                        } elseif (! ContractMemberAge::isAdultAtContractStart($dob, $startDateStr)) {
                            $validator->errors()->add("members.$index.date_of_birth", 'Người thuê chính phải đủ 18 tuổi tại ngày bắt đầu hợp đồng.');
                        }
                    }

                    if (! ContractMemberAge::requiresIdentity($isPrimary, $dob, $startDateStr)) {
                        continue;
                    }

                    if (! $hasF || ! $hasB) {
                        $msg = 'Thành viên từ đủ 18 tuổi (hoặc chưa khai báo ngày sinh) cần tải đủ ảnh CCCD.';
                        $validator->errors()->add("members.$index.identity_front_media_id", $msg);
                        $validator->errors()->add("members.$index.identity_back_media_id", $msg);
                    }
                }
            }

            // Cross-field: Path C (no user_id, no email) → require full_name + identity_number
            foreach ($members as $index => $member) {
                $hasUserId = ! empty($member['user_id']);
                $hasEmail = ! empty($member['email']);
                if (! $hasUserId && ! $hasEmail) {
                    if (empty($member['full_name'])) {
                        $validator->errors()->add("members.$index.full_name", 'Vui lòng nhập họ tên hoặc cung cấp email tài khoản.');
                    }
                    if (empty($member['identity_number']) && empty($member['phone'])) {
                        $validator->errors()->add("members.$index.identity_number", 'Vui lòng nhập CCCD hoặc SĐT để định danh người thuê.');
                    }
                }
            }

            if ($propertyId) {
                $orgId = Property::query()->whereKey($propertyId)->value('org_id');
                if ($orgId) {
                    foreach ($members as $index => $member) {
                        if (! is_array($member) || ! empty($member['user_id'])) {
                            continue;
                        }
                        $phone = isset($member['phone']) ? (string) $member['phone'] : '';
                        if (trim($phone) === '') {
                            continue;
                        }
                        $email = isset($member['email']) ? (string) $member['email'] : null;
                        $conflict = OrgUserPhone::findConflictingUserInOrg((string) $orgId, $phone, $email);
                        if ($conflict) {
                            $validator->errors()->add(
                                "members.$index.phone",
                                sprintf(
                                    'Số điện thoại đã gắn với tài khoản %s (%s). Vui lòng dùng đúng email hoặc chọn người dùng trong danh sách.',
                                    $conflict->full_name ?: '—',
                                    $conflict->email
                                )
                            );
                        }
                    }
                }
            }

            if (! $propertyId) {
                return;
            }

            $userIds = collect($members)
                ->pluck('user_id')
                ->filter()
                ->unique()
                ->values();

            if ($userIds->isEmpty()) {
                return;
            }

            $users = User::query()
                ->whereIn('id', $userIds)
                ->with(['properties:id', 'roles:id,name'])
                ->get()
                ->keyBy('id');

            foreach ($members as $index => $member) {
                $userId = $member['user_id'] ?? null;
                if (! $userId) {
                    continue;
                }

                $user = $users->get($userId);
                if (! $user) {
                    continue;
                }

                if (! $user->is_active) {
                    $validator->errors()->add("members.$index.user_id", 'Cư dân này đang bị khóa hoặc ngừng hoạt động.');
                }

                if (! $user->hasRole('Tenant')) {
                    $validator->errors()->add("members.$index.user_id", 'Chỉ tài khoản Tenant mới được thêm vào hợp đồng.');
                }

                if (! $user->properties->contains('id', $propertyId)) {
                    $validator->errors()->add("members.$index.user_id", 'Cư dân này không thuộc bất động sản đã chọn.');
                }
            }
        });
    }

    public function attributes()
    {
        return [
            'property_id' => 'Bất động sản',
            'room_id' => 'Phòng',
            'status' => 'Trạng thái',
            'start_date' => 'Ngày bắt đầu',
            'end_date' => 'Ngày kết thúc',
            'rent_price' => 'Giá thuê',
            'deposit_amount' => 'Tiền cọc',
            'deposit_months' => 'Số tháng cọc',
            'members' => 'Thành viên',
            'members.*.identity_front_media_id' => 'Ảnh CCCD mặt trước (thành viên)',
            'members.*.identity_back_media_id' => 'Ảnh CCCD mặt sau (thành viên)',
            'members.*.date_of_birth' => 'Ngày sinh (thành viên)',
        ];
    }

    private function resolveBillingCycleMonths(string|int|null $billingCycle): int
    {
        return match ((string) $billingCycle) {
            'MONTHLY' => 1,
            'QUARTERLY' => 3,
            'SEMI_ANNUALLY' => 6,
            'YEARLY' => 12,
            default => max(1, (int) $billingCycle),
        };
    }
}
