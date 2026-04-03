<?php

namespace App\Features\Property\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số lượng bản ghi mỗi trang. Example: 15
 * @queryParam page int Trang hiện tại. Example: 1
 * @queryParam search string Từ khóa tìm kiếm. Example: P.101
 * @queryParam filter[code] string Mã phòng. Example: R101
 * @queryParam filter[status] string Trạng thái. Example: AVAILABLE
 * @queryParam filter[type] string Loại phòng. Example: STANDARD
 * @queryParam filter[property_id] string ID Bất động sản. Example: uuid
 * @queryParam filter[floor_id] string ID Tầng. Example: uuid
 * @queryParam sort string Sắp xếp. Example: -code
 * @queryParam include string Các quan hệ kèm theo. Example: contracts,meters,invoices,roomServices,contracts.members,assets,media
 */
class RoomIndexRequest extends FormRequest
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
            'filter.code' => ['nullable', 'string'],
            'filter.status' => ['nullable', 'string'],
            'filter.type' => ['nullable', 'string'],
            'filter.property_id' => ['nullable', 'uuid'],
            'filter.floor_id' => ['nullable', 'uuid'],
            'filter.price_min' => ['nullable', 'numeric', 'min:0'],
            'filter.price_max' => ['nullable', 'numeric', 'min:0'],
            'filter.area_min' => ['nullable', 'numeric', 'min:0'],
            'filter.area_max' => ['nullable', 'numeric', 'min:0'],
            'filter.capacity_min' => ['nullable', 'integer', 'min:0'],
            'filter.capacity_max' => ['nullable', 'integer', 'min:0'],
            'sort' => ['nullable', 'string', 'in:code,name,status,type,area,capacity,base_price,floor_number,created_at,-code,-name,-status,-type,-area,-capacity,-base_price,-floor_number,-created_at'],
        ];
    }

    public function attributes()
    {
        return [
            'per_page' => 'Số lượng bản ghi mỗi trang',
            'page' => 'Trang',
            'search' => 'Từ khóa tìm kiếm',
            'with_trashed' => 'Bao gồm bản ghi đã xóa',
            'filter.code' => 'Mã phòng',
            'filter.status' => 'Trạng thái',
            'filter.type' => 'Loại phòng',
            'filter.property_id' => 'ID Bất động sản',
            'filter.floor_id' => 'ID Tầng',
            'sort' => 'Sắp xếp',
        ];
    }
}
