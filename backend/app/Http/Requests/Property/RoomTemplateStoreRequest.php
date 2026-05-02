<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

class RoomTemplateStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Merge the route {property} parameter so property_id is available for validation
     * regardless of whether it's sent in the request body or only in the URL.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('property_id') && $this->route('property')) {
            $this->merge(['property_id' => $this->route('property')]);
        }
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'uuid', 'exists:properties,id'],
            'name' => ['required', 'string', 'max:255'],
            'area' => ['required', 'numeric', 'min:0'],
            'capacity' => ['required', 'integer', 'min:1'],
            'base_price' => ['required', 'numeric', 'min:0'],
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
            'property_id.exists' => 'Bất động sản không tồn tại hoặc bạn không có quyền truy cập.',
        ];
    }
}
