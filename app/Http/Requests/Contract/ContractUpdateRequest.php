<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;



class ContractUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string', 'in:DRAFT,ACTIVE,ENDED,CANCELLED'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'billing_cycle' => ['nullable', 'string', 'in:MONTHLY,QUARTERLY'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'cutoff_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'rent_price' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'meta' => ['nullable', 'array'],
        ];
    }

    public function attributes()
    {
        return [
            'status' => 'Trạng thái',
            'start_date' => 'Ngày bắt đầu',
            'end_date' => 'Ngày kết thúc',
            'rent_price' => 'Giá thuê',
            'deposit_amount' => 'Tiền cọc',
        ];
    }
}
