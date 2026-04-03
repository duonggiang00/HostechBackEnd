<?php

namespace App\Http\Requests\Contract;

use App\Enums\ContractStatus;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
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
            'cutoff_day' => ['nullable', 'integer', 'min:1', 'max:25'],
            'rent_price' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],

            // Member validation
            'members' => ['required', 'array', 'min:1'],
            'members.*.user_id' => ['required', 'uuid', 'distinct', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'members.*.full_name' => ['nullable', 'string', 'max:255'],
            'members.*.phone' => ['nullable', 'string', 'max:20'],
            'members.*.identity_number' => ['nullable', 'string', 'max:50'],
            'members.*.role' => ['nullable', 'string', 'in:TENANT,ROOMMATE,GUARANTOR'],
            'members.*.is_primary' => ['nullable', 'boolean'],
            'members.*.joined_at' => ['nullable', 'date'],

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

            if ($dueDay !== null && $cutoffDay !== null && (int) $cutoffDay > (int) $dueDay) {
                $validator->errors()->add('cutoff_day', 'Ngày chốt số không được sau hạn nộp.');
            }

            if ($propertyId && $roomId) {
                $room = Room::query()
                    ->select(['id', 'property_id', 'status'])
                    ->find($roomId);

                if ($room && $room->property_id !== $propertyId) {
                    $validator->errors()->add('room_id', 'Phòng không thuộc bất động sản đã chọn.');
                }

                if ($room && $room->status === 'maintenance') {
                    $validator->errors()->add('room_id', 'Phòng đang bảo trì, không thể tạo hợp đồng mới.');
                }
            }

            if ($propertyId && $startDate && $endDate) {
                $effectiveBillingCycle = $this->resolveBillingCycleMonths(
                    $this->input('billing_cycle')
                    ?? Property::query()->whereKey($propertyId)->value('default_billing_cycle')
                    ?? 1
                );

                $minimumEndDate = \Carbon\Carbon::parse($startDate)
                    ->addMonths($effectiveBillingCycle)
                    ->toDateString();

                if (\Carbon\Carbon::parse($endDate)->lt(\Carbon\Carbon::parse($minimumEndDate))) {
                    $validator->errors()->add(
                        'end_date',
                        "Ngay ket thuc khong duoc nho hon {$minimumEndDate} theo chu ky thue."
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
            'members' => 'Thành viên',
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
