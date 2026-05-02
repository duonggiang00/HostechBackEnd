<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

class RoomTemplateUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'numeric', 'min:0'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'base_price' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'services' => ['nullable', 'array'],
            'services.*' => ['uuid', 'exists:services,id'],
            'assets' => ['nullable', 'array'],
            'assets.*.name' => ['required', 'string', 'max:255'],
            'assets.*.condition' => ['nullable', 'string'],
            'assets.*.note' => ['nullable', 'string'],
            'assets.*.quantity' => ['nullable', 'integer', 'min:1'],
            'media_ids' => ['nullable', 'array'],
            'media_ids.*' => ['uuid', 'exists:media,uuid'],
        ];
    }

    public function messages(): array
    {
        return [
            'media_ids.*.uuid' => 'Ảnh tải lên không đúng định dạng.',
            'media_ids.*.exists' => 'Một hoặc nhiều ảnh đã hết hạn hoặc không còn tồn tại. Vui lòng tải lại ảnh.',
            'services.*.exists' => 'Một hoặc nhiều dịch vụ đã không còn tồn tại. Vui lòng tải lại danh sách dịch vụ.',
        ];
    }
}
