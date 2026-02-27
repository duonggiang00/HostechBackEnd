<?php

namespace App\Http\Requests\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class InvoiceStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Policy xử lý authorization
    }

    public function rules(): array
    {
        return [
            // Liên kết bắt buộc
            'property_id'  => ['required', 'uuid', 'exists:properties,id'],
            'contract_id'  => ['required', 'uuid', 'exists:contracts,id'],
            'room_id'      => ['required', 'uuid', 'exists:rooms,id'],

            // Kỳ thanh toán
            'period_start' => ['required', 'date'],
            'period_end'   => ['required', 'date', 'after:period_start'],
            'due_date'     => ['required', 'date'],

            // Trạng thái (mặc định DRAFT nếu không gửi)
            'status'       => ['nullable', 'string', 'in:DRAFT,ISSUED,PENDING,PAID,OVERDUE,CANCELLED'],

            // Danh sách chi tiết (items) - bắt buộc ít nhất 1
            'items'               => ['required', 'array', 'min:1'],
            'items.*.type'        => ['required', 'string', 'in:RENT,SERVICE,PENALTY,DISCOUNT,ADJUSTMENT'],
            'items.*.service_id'  => ['nullable', 'uuid', 'exists:services,id'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity'    => ['required', 'numeric', 'min:0'],
            'items.*.unit_price'  => ['required', 'numeric'],
            'items.*.amount'      => ['required', 'numeric'],
            'items.*.meta'        => ['nullable', 'array'],
        ];
    }

    /**
     * Tên hiển thị các field (cho thông báo lỗi tiếng Việt).
     */
    public function attributes(): array
    {
        return [
            'property_id'          => 'Tòa nhà',
            'contract_id'          => 'Hợp đồng',
            'room_id'              => 'Phòng',
            'period_start'         => 'Ngày bắt đầu kỳ',
            'period_end'           => 'Ngày kết thúc kỳ',
            'due_date'             => 'Hạn thanh toán',
            'status'               => 'Trạng thái',
            'items'                => 'Chi tiết hóa đơn',
            'items.*.type'         => 'Loại phí',
            'items.*.description'  => 'Mô tả',
            'items.*.quantity'     => 'Số lượng',
            'items.*.unit_price'   => 'Đơn giá',
            'items.*.amount'       => 'Thành tiền',
        ];
    }
}