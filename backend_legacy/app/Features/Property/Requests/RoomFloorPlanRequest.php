<?php

namespace App\Features\Property\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam floor_id string required ID tầng chứa phòng trên sơ đồ. Example: uuid
 * @bodyParam x number required Tọa độ ngang (%). Example: 25.5
 * @bodyParam y number required Tọa độ dọc (%). Example: 40.0
 * @bodyParam width number Chiều rộng node. Example: 100
 * @bodyParam height number Chiều cao node. Example: 60
 * @bodyParam rotation number Góc xoay (độ). Example: 0
 * @bodyParam label string Nhãn hiển thị trên sơ đồ. Example: P.101
 * @bodyParam meta json Metadata bổ sung (màu sắc, icon...).
 */
class RoomFloorPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'floor_id' => ['required', 'uuid', 'exists:floors,id'],
            'x'        => ['required', 'numeric'],
            'y'        => ['required', 'numeric'],
            'width'    => ['nullable', 'numeric', 'min:1'],
            'height'   => ['nullable', 'numeric', 'min:1'],
            'rotation' => ['nullable', 'numeric'],
            'label'    => ['nullable', 'string', 'max:50'],
            'meta'     => ['nullable', 'json'],
        ];
    }
}
