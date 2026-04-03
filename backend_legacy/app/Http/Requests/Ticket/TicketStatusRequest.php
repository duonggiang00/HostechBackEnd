<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam status string required Trạng thái mới của ticket. Enum: OPEN, RECEIVED, IN_PROGRESS, WAITING_PARTS, DONE, CANCELLED. Example: IN_PROGRESS
 * @bodyParam message string Ghi chú / lý do chuyển trạng thái. Example: Đã tiếp nhận và cử kỹ thuật viên sang kiểm tra
 */
class TicketStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:OPEN,RECEIVED,IN_PROGRESS,WAITING_PARTS,DONE,CANCELLED'],
            'message' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
