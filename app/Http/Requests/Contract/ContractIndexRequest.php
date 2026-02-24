<?php

namespace App\Http\Requests\Contract;

use Illuminate\Foundation\Http\FormRequest;



class ContractIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'search' => ['nullable', 'string'],
            'with_trashed' => ['nullable', 'boolean'],
            'org_id' => ['nullable', 'uuid'],
            
            'filter.property_id' => ['nullable', 'uuid'],
            'filter.room_id' => ['nullable', 'uuid'],
            'filter.status' => ['nullable', 'string', 'in:DRAFT,ACTIVE,ENDED,CANCELLED'],
            
            'sort' => ['nullable', 'string', 'in:start_date,end_date,created_at,status,rent_price,-start_date,-end_date,-created_at,-status,-rent_price'],
        ];
    }

    public function attributes()
    {
        return [
            'per_page' => 'Số lượng bản ghi mỗi trang',
            'page' => 'Trang',
            'search' => 'Từ khóa tìm kiếm',
            'with_trashed' => 'Bao gồm bản ghi đã xóa',
            'org_id' => 'ID Tổ chức',
            'filter.property_id' => 'ID Bất động sản',
            'filter.room_id' => 'ID Phòng',
            'filter.status' => 'Trạng thái',
            'sort' => 'Sắp xếp',
        ];
    }
}
