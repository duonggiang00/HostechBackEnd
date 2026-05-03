<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

/**
 * @bodyParam files file[] required Mảng file đính kèm. Tối đa 10 file mỗi lần upload, mỗi file ≤ 8MB.
 */
class TicketAttachmentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => [
                'required',
                'file',
                'max:8192', // KB → 8MB
                'mimes:jpg,jpeg,png,webp,gif,pdf',
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'files' => 'Tệp đính kèm',
            'files.*' => 'Tệp đính kèm',
        ];
    }
}
