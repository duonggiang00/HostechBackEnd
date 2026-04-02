<?php

namespace App\Features\Finance\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam property_id uuid ID tòa nhà (tùy chọn). Example: 9b9eb2ee-1234-5678-abcd-1234567890ab
 * @bodyParam payer_user_id uuid ID người nộp tiền. Example: 9b9eb2ee-...
 * @bodyParam method string Required. Phương thức thanh toán: CASH, TRANSFER, WALLET, QR. Example: TRANSFER
 * @bodyParam amount decimal Required. Tổng tiền thu. Example: 5500000.00
 * @bodyParam received_at string Thời gian nhận tiền (ISO 8601). Example: 2024-03-16T15:00:00Z
 * @bodyParam reference string Mã tham chiếu (số CK, mã QR...). Example: CK_PHONG_A101_THANG_3
 * @bodyParam note string Ghi chú. Example: Thu tiền phòng và phí dịch vụ
 * @bodyParam allocations array Required. Danh sách hóa đơn gạch nợ.
 * @bodyParam allocations[].invoice_id uuid Required. ID hóa đơn. Example: uuid-inv-1
 * @bodyParam allocations[].amount decimal Required. Số tiền gạch vào hóa đơn này. Example: 5000000.00
 */
class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'org_id'                   => ['required', 'uuid', 'exists:orgs,id'],
            'property_id'              => ['nullable', 'uuid', 'exists:properties,id'],

            'payer_user_id'            => ['nullable', 'uuid', 'exists:users,id'],
            'method'                   => ['required', 'string', 'in:CASH,TRANSFER,WALLET,QR'],
            'amount'                   => ['required', 'numeric', 'min:0.01'],
            'received_at'              => ['nullable', 'date'],
            'reference'                => ['nullable', 'string', 'max:255'],
            'note'                     => ['nullable', 'string', 'max:1000'],

            'allocations'              => ['required', 'array', 'min:1'],
            'allocations.*.invoice_id' => ['required', 'uuid', 'exists:invoices,id'],
            'allocations.*.amount'     => ['required', 'numeric', 'min:0.01'],

            // Dành cho VNPay
            'bank_code'                => ['nullable', 'string', 'max:20'],
            'meta'                     => ['nullable', 'array'],
        ];
    }

    public function attributes(): array
    {
        return [
            'org_id'                   => 'ID tổ chức',
            'method'                   => 'Phương thức thanh toán',

            'amount'                   => 'Số tiền thu',
            'received_at'              => 'Thời gian nhận tiền',
            'reference'                => 'Mã tham chiếu',
            'allocations'              => 'Danh sách gạch nợ',
            'allocations.*.invoice_id' => 'ID hóa đơn',
            'allocations.*.amount'     => 'Số tiền gạch nợ',
        ];
    }
}
