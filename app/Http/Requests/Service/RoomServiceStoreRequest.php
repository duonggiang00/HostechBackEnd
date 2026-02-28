<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

use Illuminate\Validation\Rule;

/**
 * @bodyParam service_id string required ID dịch vụ. Example: uuid-1234
 * @bodyParam quantity int Số lượng. Default: 1. Example: 1
 * @bodyParam included_units int Số đơn vị miễn phí/định mức bao (dùng cho điện/nước). Default: 0. Example: 5
 * @bodyParam meta json Thuộc tính JSON bổ sung.
 */
class RoomServiceStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roomId = $this->route('room');

        return [
            'service_id' => [
                'required', 
                'uuid', 
                Rule::exists('services', 'id')->where('org_id', $this->user()->org_id),
                Rule::unique('room_services')->where(function ($query) use ($roomId) {
                    return $query->where('room_id', $roomId);
                })
            ],
            'quantity' => ['required', 'integer', 'min:1'],
            'included_units' => ['nullable', 'integer', 'min:0'],
            'meta' => ['nullable', 'json'],
        ];
    }
}
