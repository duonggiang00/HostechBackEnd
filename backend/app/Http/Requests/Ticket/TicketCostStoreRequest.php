<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam amount number required Số tiền chi phí (VND). Example: 150000
 * @bodyParam payer string required Bên chịu chi phí. Enum: OWNER, TENANT. Example: TENANT
 * @bodyParam note string Ghi chú chi tiết. Example: Tiền thay bóng đèn LED
 */
class TicketCostStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0'],
            'payer' => ['required', 'string', 'in:OWNER,TENANT'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
