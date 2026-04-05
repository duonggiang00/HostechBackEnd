<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

class SyncBuildingOverviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in Controller via Policy
    }

    public function rules(): array
    {
        return [
            // Optional: template dùng cho TẤT CẢ phòng mới (nếu không override riêng)
            'template_id'             => ['nullable', 'uuid', 'exists:room_templates,id'],

            // Mảng các tầng (cũ và mới) kèm danh sách phòng và vị trí
            'sync_data'               => ['required', 'array', 'min:1'],
            'sync_data.*.floor_id'    => ['nullable', 'string'],        // uuid tầng cũ
            'sync_data.*.temp_id'     => ['nullable', 'string'],        // id tạm tầng mới
            'sync_data.*.name'        => ['nullable', 'string', 'max:100'],
            'sync_data.*.floor_number'=> ['nullable', 'integer', 'min:1'],

            // Phòng trong mỗi tầng
            'sync_data.*.rooms'               => ['required', 'array'],
            'sync_data.*.rooms.*.id'          => ['nullable', 'string'],     // uuid phòng cũ
            'sync_data.*.rooms.*.temp_id'     => ['nullable', 'string'],     // id tạm phòng mới
            'sync_data.*.rooms.*.code'        => ['nullable', 'string', 'max:50'],
            'sync_data.*.rooms.*.template_id' => ['nullable', 'uuid', 'exists:room_templates,id'],
            'sync_data.*.rooms.*.x'           => ['required', 'integer', 'min:0'], // column
            'sync_data.*.rooms.*.y'           => ['nullable', 'integer', 'min:0'], // row (default 0)
            'sync_data.*.rooms.*.width'       => ['nullable', 'integer', 'min:1'], // col_span
            'sync_data.*.rooms.*.height'      => ['nullable', 'integer', 'min:1'], // row_span

            // Danh sách ID cần xóa (soft delete)
            'deleted_room_ids'   => ['nullable', 'array'],
            'deleted_room_ids.*' => ['uuid', 'exists:rooms,id'],
            'deleted_floor_ids'  => ['nullable', 'array'],
            'deleted_floor_ids.*'=> ['uuid', 'exists:floors,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'sync_data.required'         => 'Dữ liệu đồng bộ mặt bằng không được để trống.',
            'sync_data.*.rooms.required' => 'Mỗi tầng phải có danh sách phòng.',
            'sync_data.*.rooms.*.x.required' => 'Mỗi phòng phải có vị trí cột (column_index).',
        ];
    }
}
