<?php

namespace App\Features\Invoice\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InvoiceAdjustmentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Policy xử lý authorization
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:CREDIT,DEBIT'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'type' => 'Loại điều chỉnh',
            'amount' => 'Số tiền',
            'reason' => 'Lý do điều chỉnh',
        ];
    }
}
