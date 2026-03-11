<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam message string required Nội dung bình luận / trao đổi. Example: Anh kỹ thuật báo khoảng 15p nữa có mặt nhé
 */
class TicketEventStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'max:3000'],
        ];
    }
}
