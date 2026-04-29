<?php

namespace App\Http\Requests\Contract;

use App\Models\Contract\Contract;
use App\Models\Org\User;
use App\Models\System\TemporaryUpload;
use App\Support\ContractMemberAge;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ContractMemberStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'email' => ['nullable', 'email', 'max:255'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'identity_number' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['nullable', 'date'],
            'license_plate' => ['nullable', 'string', 'max:50'],
            'role' => ['required', 'string', 'in:TENANT,ROOMMATE,GUARANTOR'],
            'is_primary' => ['sometimes', 'boolean'],
            'joined_at' => ['nullable', 'date'],
            'left_at' => ['nullable', 'date'],
            'permanent_address' => ['nullable', 'string', 'max:500'],
            'identity_front_media_id' => [
                'nullable',
                'uuid',
                Rule::exists('media', 'uuid')->where('model_type', TemporaryUpload::class),
            ],
            'identity_back_media_id' => [
                'nullable',
                'uuid',
                Rule::exists('media', 'uuid')->where('model_type', TemporaryUpload::class),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $d = $v->getData();
            $hasUser = ! empty($d['user_id']);
            $hasEmail = isset($d['email']) && is_string($d['email']) && trim($d['email']) !== '';
            $hasManual = isset($d['full_name']) && is_string($d['full_name']) && trim($d['full_name']) !== '';

            if (! $hasUser && ! $hasEmail && ! $hasManual) {
                $v->errors()->add('email', 'Vui lòng nhập email tài khoản, chọn user_id, hoặc khai báo họ tên người ở cùng.');
            }

            $contractId = $this->route('contract');
            $contract = $contractId ? Contract::query()->find($contractId) : null;
            if (! $contract) {
                return;
            }

            if ($contract->room_id) {
                $room = $contract->room()->select(['id', 'capacity'])->first();
                $capacity = (int) ($room?->capacity ?? 0);
                if ($capacity > 0) {
                    $currentOccupants = $contract->members()
                        ->whereNull('left_at')
                        ->count();
                    if (($currentOccupants + 1) > $capacity) {
                        $v->errors()->add(
                            'contract_id',
                            "Phòng chỉ giới hạn {$capacity} người. Không thể thêm thành viên mới."
                        );
                    }
                }
            }

            if (! $contract->start_date) {
                return;
            }

            try {
                $start = Carbon::parse($contract->start_date)->toDateString();
            } catch (\Throwable) {
                return;
            }

            $dob = null;
            if (! empty($d['date_of_birth'])) {
                try {
                    $dob = Carbon::parse($d['date_of_birth'])->toDateString();
                } catch (\Throwable) {
                    $dob = null;
                }
            }

            if ($dob === null && ! empty($d['user_id'])) {
                $raw = User::query()->whereKey($d['user_id'])->value('date_of_birth');
                $dob = $raw ? Carbon::parse($raw)->toDateString() : null;
            }

            $isPrimary = filter_var($d['is_primary'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if ($isPrimary) {
                if ($dob === null) {
                    $v->errors()->add('date_of_birth', 'Người thuê chính cần có ngày sinh (khai báo hoặc trong tài khoản liên kết).');
                } elseif (! ContractMemberAge::isAdultAtContractStart($dob, $start)) {
                    $v->errors()->add('date_of_birth', 'Người thuê chính phải đủ 18 tuổi tại ngày bắt đầu hợp đồng.');
                }
            }

            $front = ! empty($d['identity_front_media_id']) ? trim((string) $d['identity_front_media_id']) : null;
            $back = ! empty($d['identity_back_media_id']) ? trim((string) $d['identity_back_media_id']) : null;
            $hasF = (bool) $front;
            $hasB = (bool) $back;

            if ($hasF xor $hasB) {
                $v->errors()->add('identity_front_media_id', 'Khi tải CCCD, vui lòng gửi cả mặt trước và mặt sau.');

                return;
            }

            if (! ContractMemberAge::requiresIdentity($isPrimary, $dob, $start)) {
                return;
            }

            if (! $hasF || ! $hasB) {
                $msg = 'Thành viên từ đủ 18 tuổi (hoặc chưa khai báo ngày sinh) cần tải đủ ảnh CCCD.';
                $v->errors()->add('identity_front_media_id', $msg);
                $v->errors()->add('identity_back_media_id', $msg);
            }
        });
    }

    public function attributes()
    {
        return [
            'user_id' => 'Tài khoản hệ thống',
            'email' => 'Email',
            'full_name' => 'Họ và tên',
            'phone' => 'Số điện thoại',
            'identity_number' => 'CMND/CCCD',
            'role' => 'Vai trò',
            'is_primary' => 'Đại diện chính',
            'identity_front_media_id' => 'Ảnh CCCD mặt trước',
            'identity_back_media_id' => 'Ảnh CCCD mặt sau',
        ];
    }
}
