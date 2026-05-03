<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

class RoomTransferPreviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target_room_id' => 'required|exists:rooms,id',
            'transfer_date' => 'required|date',
            'rent_price' => 'nullable|numeric|min:0',
        ];
    }
}
