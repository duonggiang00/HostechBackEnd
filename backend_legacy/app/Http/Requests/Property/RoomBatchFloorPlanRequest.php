<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

class RoomBatchFloorPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nodes' => ['required', 'array', 'min:1'],
            'nodes.*.room_id' => ['required', 'uuid', 'exists:rooms,id'],
            'nodes.*.x' => ['required', 'numeric', 'min:0', 'max:100'],
            'nodes.*.y' => ['required', 'numeric', 'min:0', 'max:100'],
            'nodes.*.width' => ['nullable', 'numeric', 'min:0'],
            'nodes.*.height' => ['nullable', 'numeric', 'min:0'],
            'nodes.*.rotation' => ['nullable', 'numeric', 'min:0', 'max:360'],
        ];
    }
}
