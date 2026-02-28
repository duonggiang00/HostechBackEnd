<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @bodyParam property_id string required UUID của Tòa nhà. Example: uuid
 * @bodyParam room_id string required UUID của Phòng. Example: uuid
 * @bodyParam category string Loại sự cố (Điện, Nước, Cơ sở vật chất…). Example: Điện
 * @bodyParam priority string Mức độ ưu tiên. Enum: LOW, MEDIUM, HIGH, URGENT. Example: MEDIUM
 * @bodyParam description string required Mô tả chi tiết sự cố. Example: Bóng đèn phòng khách bị hỏng
 */
class TicketStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()?->org_id;

        return [
            'property_id' => ['required', 'uuid', Rule::exists('properties', 'id')->where('org_id', $orgId)],
            'room_id' => ['required', 'uuid', Rule::exists('rooms', 'id')->where('org_id', $orgId)],
            'category' => ['nullable', 'string', 'max:100'],
            'priority' => ['nullable', 'string', 'in:LOW,MEDIUM,HIGH,URGENT'],
            'description' => ['required', 'string', 'max:5000'],
        ];
    }
}
