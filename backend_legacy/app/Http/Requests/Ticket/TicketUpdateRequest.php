<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @bodyParam priority string Mức độ ưu tiên. Enum: LOW, MEDIUM, HIGH, URGENT. Example: URGENT
 * @bodyParam category string Loại sự cố. Example: Điện
 * @bodyParam assigned_to_user_id string UUID nhân viên được giao xử lý. Example: uuid
 * @bodyParam due_at string Hạn xử lý (Y-m-d H:i:s). Example: 2026-03-01 15:00:00
 */
class TicketUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()?->org_id;

        return [
            'priority' => ['nullable', 'string', 'in:LOW,MEDIUM,HIGH,URGENT'],
            'category' => ['nullable', 'string', 'max:100'],
            'assigned_to_user_id' => ['nullable', 'uuid', Rule::exists('users', 'id')->where('org_id', $orgId)],
            'due_at' => ['nullable', 'date'],
        ];
    }
}
