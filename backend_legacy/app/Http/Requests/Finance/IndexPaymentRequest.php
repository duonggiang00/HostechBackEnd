<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @queryParam per_page int Số bản ghi mỗi trang. Example: 15
 * @queryParam page int Trang hiện tại. Example: 1
 * @queryParam filter[property_id] uuid Lọc theo tòa nhà.
 * @queryParam filter[status] string Lọc theo trạng thái: PENDING, APPROVED, REJECTED.
 * @queryParam filter[method] string Lọc theo PTTT: CASH, TRANSFER, WALLET, QR.
 * @queryParam filter[received_between] string Lọc theo khoảng thời gian nhận tiền (ISO 8601, phân cách bằng dấu phẩy). Example: 2024-03-01,2024-03-31
 * @queryParam search string Tìm theo mã tham chiếu hoặc ghi chú.
 * @queryParam sort string Sắp xếp. Example: -received_at
 */
class IndexPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'per_page'                    => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'                        => ['nullable', 'integer', 'min:1'],
            'search'                      => ['nullable', 'string', 'max:255'],
            'filter.property_id'          => ['nullable', 'uuid'],
            'filter.status'               => ['nullable', 'string', 'in:PENDING,APPROVED,REJECTED'],
            'filter.method'               => ['nullable', 'string', 'in:CASH,TRANSFER,WALLET,QR'],
            'filter.payer_user_id'        => ['nullable', 'uuid'],
            'filter.received_between'     => ['nullable', 'string', 'regex:/^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/'],
            'sort'                        => ['nullable', 'string', 'in:received_at,amount,created_at,status,-received_at,-amount,-created_at,-status'],
        ];
    }
}
