<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;

class ExecuteRoomTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorize in controller
    }

    public function rules(): array
    {
        return [
            'target_room_id'       => 'required|exists:rooms,id',
            'transfer_date'        => 'required|date',
            'rent_price'           => 'nullable|numeric|min:0',
            'deposit_amount'       => 'nullable|numeric|min:0',
            'transfer_unused_rent' => 'required|boolean',
        ];
    }
}
