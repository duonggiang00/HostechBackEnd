<?php

namespace App\Http\Requests\Contract;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\System\TemporaryUpload;
use App\Support\ContractMemberAge;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ContractMemberUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'identity_number' => ['nullable', 'string', 'max:50'],
            'role' => ['nullable', 'string', 'in:TENANT,ROOMMATE,GUARANTOR'],
            'is_primary' => ['boolean'],
            'joined_at' => ['nullable', 'date'],
            'left_at' => ['nullable', 'date'],
            'permanent_address' => ['nullable', 'string', 'max:500'],
            'date_of_birth' => ['nullable', 'date'],
            'license_plate' => ['nullable', 'string', 'max:50'],
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
            $hasFront = ! empty($d['identity_front_media_id']);
            $hasBack = ! empty($d['identity_back_media_id']);
            if ($hasFront xor $hasBack) {
                $v->errors()->add('identity_front_media_id', 'Khi đổi ảnh CCCD, vui lòng gửi cả mặt trước và mặt sau.');
                $v->errors()->add('identity_back_media_id', 'Khi đổi ảnh CCCD, vui lòng gửi cả mặt trước và mặt sau.');

                return;
            }

            $contractId = $this->route('contract');
            $memberId = $this->route('member');
            if (! $contractId || ! $memberId) {
                return;
            }

            $contract = Contract::query()->find($contractId);
            $member = ContractMember::query()->where('contract_id', $contractId)->find($memberId);
            if (! $contract?->start_date || ! $member) {
                return;
            }

            try {
                $start = Carbon::parse($contract->start_date)->toDateString();
            } catch (\Throwable) {
                return;
            }

            $requestDobStr = null;
            if (array_key_exists('date_of_birth', $d) && $d['date_of_birth'] !== null && $d['date_of_birth'] !== '') {
                try {
                    $requestDobStr = Carbon::parse($d['date_of_birth'])->toDateString();
                } catch (\Throwable) {
                    $requestDobStr = null;
                }
            }

            $effectiveDob = $requestDobStr;
            if ($effectiveDob === null && $member->date_of_birth) {
                $effectiveDob = Carbon::parse($member->date_of_birth)->toDateString();
            }

            $isPrimary = $member->is_primary;

            if ($isPrimary) {
                if ($effectiveDob === null) {
                    $v->errors()->add('date_of_birth', 'Người thuê chính cần có ngày sinh.');

                    return;
                }
                if (! ContractMemberAge::isAdultAtContractStart($effectiveDob, $start)) {
                    $v->errors()->add('date_of_birth', 'Người thuê chính phải đủ 18 tuổi tại ngày bắt đầu hợp đồng.');

                    return;
                }
            }

            if (! ContractMemberAge::requiresIdentity($isPrimary, $effectiveDob, $start)) {
                return;
            }

            $dobTouched = array_key_exists('date_of_birth', $d);
            $identityTouched = $hasFront || $hasBack;

            if (! $dobTouched && ! $identityTouched) {
                return;
            }

            $dbFront = $member->getMedia('identity_front')->isNotEmpty();
            $dbBack = $member->getMedia('identity_back')->isNotEmpty();
            $hasDbPair = $dbFront && $dbBack;
            $hasNewPair = $hasFront && $hasBack;

            if (! $hasDbPair && ! $hasNewPair) {
                $v->errors()->add('identity_front_media_id', 'Thành viên cần tải đủ ảnh CCCD (mặt trước và mặt sau).');
                $v->errors()->add('identity_back_media_id', 'Thành viên cần tải đủ ảnh CCCD (mặt trước và mặt sau).');
            }
        });
    }

    public function attributes()
    {
        return [
            'user_id' => 'Tài khoản hệ thống',
            'full_name' => 'Họ và tên',
            'phone' => 'Số điện thoại',
            'identity_number' => 'CMND/CCCD',
            'role' => 'Vai trò',
            'is_primary' => 'Đại diện chính',
            'date_of_birth' => 'Ngày sinh',
            'license_plate' => 'Biển số xe',
            'permanent_address' => 'Địa chỉ thường trú',
            'identity_front_media_id' => 'Ảnh CCCD mặt trước',
            'identity_back_media_id' => 'Ảnh CCCD mặt sau',
        ];
    }
}
