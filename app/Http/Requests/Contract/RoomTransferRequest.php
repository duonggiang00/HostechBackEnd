<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam target_room_id string required ID phòng muốn chuyển sang (UUID). Example: 9dad0e1f-2031-4192-bff0-e1e043ce43ce
 * @bodyParam reason string Lý do muốn đổi phòng. Example: Phòng quá nhỏ.
 */
class RoomTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_room_id' => ['required', 'uuid', 'exists:rooms,id'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function attributes()
    {
        return [
            'target_room_id' => 'ID phòng mục tiêu',
            'reason' => 'Lý do đổi phòng',
        ];
    }
}
