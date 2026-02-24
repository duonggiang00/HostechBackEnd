<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContractStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'uuid', 'exists:properties,id'],
            'room_id' => ['required', 'uuid', 'exists:rooms,id'],
            'status' => ['nullable', 'string', 'in:DRAFT,ACTIVE,ENDED,CANCELLED'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'billing_cycle' => ['nullable', 'string', 'in:MONTHLY,QUARTERLY'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'cutoff_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'rent_price' => ['required', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            
            // Member validation
            'members' => ['nullable', 'array'],
            'members.*.user_id' => ['required', 'uuid', 'exists:users,id'],
            'members.*.role' => ['nullable', 'string', 'in:TENANT,ROOMMATE,GUARANTOR'],
            'members.*.is_primary' => ['nullable', 'boolean'],
            'members.*.joined_at' => ['nullable', 'date'],
            
            'meta' => ['nullable', 'array'],
        ];
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
}
