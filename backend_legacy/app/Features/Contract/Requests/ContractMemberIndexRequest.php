<?php

namespace App\Features\Contract\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng bản ghi trên một trang. Mặc định 15. Example: 10
 * @queryParam page int Trang hiện tại. Example: 1
 * @queryParam search string Từ khóa tìm kiếm (tên, số điện thoại, CCCD).
 * @queryParam filter[role] string Vai trò trong hợp đồng. Example: PRIMARY
 * @queryParam filter[status] string Trạng thái thành viên. Enum: PENDING, APPROVED, REJECTED.
 * @queryParam sort string Sắp xếp. Example: -joined_at
 */
class ContractMemberIndexRequest extends FormRequest
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
            'filter.role' => ['nullable', 'string'],
            'filter.status' => ['nullable', 'string', 'in:PENDING,APPROVED,REJECTED'],
            'sort' => ['nullable', 'string'],
        ];
    }

    public function attributes()
    {
        return [
            'per_page' => 'Số lượng bản ghi mỗi trang',
            'page' => 'Trang',
            'search' => 'Từ khóa tìm kiếm',
            'filter.role' => 'Vai trò',
            'filter.status' => 'Trạng thái',
            'sort' => 'Sắp xếp',
        ];
    }
}
