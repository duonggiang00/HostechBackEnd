<?php

namespace App\Http\Requests\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class InvoiceUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string', 'in:DRAFT,ISSUED,PENDING,PAID,OVERDUE,CANCELLED'],
            'due_date' => ['nullable', 'date'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date', 'after:period_start'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'issue_date' => ['nullable', 'date'],
        ];
    }

    public function attributes(): array
    {
        return [
            'status' => 'Trạng thái',
            'due_date' => 'Hạn thanh toán',
            'period_start' => 'Ngày bắt đầu kỳ',
            'period_end' => 'Ngày kết thúc kỳ',
            'paid_amount' => 'Số tiền đã trả',
            'issue_date' => 'Ngày phát hành',
        ];
    }
}
//test