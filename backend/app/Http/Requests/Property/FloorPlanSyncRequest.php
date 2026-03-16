<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam nodes array required Array of room node positions.
 * @bodyParam nodes.*.room_id string required The UUID of the room. Example: uuid
 * @bodyParam nodes.*.x number required X position (%). Example: 10.5
 * @bodyParam nodes.*.y number required Y position (%). Example: 20.5
 * @bodyParam nodes.*.width number required Width (%). Example: 15.0
 * @bodyParam nodes.*.height number required Height (%). Example: 15.0
 * @bodyParam nodes.*.rotation number optional Rotation angle. Example: 0
 * @bodyParam nodes.*.label string optional Label for the node.
 */
class FloorPlanSyncRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nodes'            => ['present', 'array'],
            'nodes.*.room_id'  => ['required', 'uuid', 'exists:rooms,id'],
            'nodes.*.x'        => ['required', 'numeric'],
            'nodes.*.y'        => ['required', 'numeric'],
            'nodes.*.width'    => ['required', 'numeric', 'min:0'],
            'nodes.*.height'   => ['required', 'numeric', 'min:0'],
            'nodes.*.rotation' => ['nullable', 'numeric'],
            'nodes.*.label'    => ['nullable', 'string', 'max:50'],
        ];
    }
}
