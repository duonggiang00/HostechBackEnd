<?php

namespace App\Http\Requests\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class InvoiceIndexRequest extends FormRequest
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
            'org_id' => ['nullable', 'uuid'],

            'filter.property_id' => ['nullable', 'uuid'],
            'filter.room_id' => ['nullable', 'uuid'],
            'filter.contract_id' => ['nullable', 'uuid'],
            'filter.status' => ['nullable', 'string', 'in:DRAFT,ISSUED,PENDING,PAID,OVERDUE,CANCELLED'],

            'sort' => ['nullable', 'string', 'in:due_date,total_amount,created_at,status,period_start,period_end,-due_date,-total_amount,-created_at,-status,-period_start,-period_end'],
        ];
    }

    public function attributes()
    {
        return [
            'per_page' => 'Số lượng bản ghi mỗi trang',
            'page' => 'Trang',
            'search' => 'Từ khóa tìm kiếm',
            'org_id' => 'ID Tổ chức',
            'filter.property_id' => 'ID Tòa nhà',
            'filter.room_id' => 'ID Phòng',
            'filter.contract_id' => 'ID Hợp đồng',
            'filter.status' => 'Trạng thái hóa đơn',
            'sort' => 'Sắp xếp',
        ];
    }
}
