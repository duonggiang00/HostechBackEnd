<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServiceUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $serviceId = $this->route('service'); // Param name in route
        $orgId = $this->user()->org_id;

        return [
            'code' => [
                'sometimes', 
                'string', 
                'max:50', 
                Rule::unique('services')->ignore($serviceId)->where(function ($query) use ($orgId) {
                    return $query->where('org_id', $orgId);
                })
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'calc_mode' => ['sometimes', 'string', 'in:PER_ROOM,PER_PERSON,PER_QUANTITY,PER_METER'],
            'unit' => ['sometimes', 'string', 'max:20'],
            'is_recurring' => ['boolean'],
            'is_active' => ['boolean'],

            // Rate fields (Optional on update)
            'price' => ['sometimes', 'numeric', 'min:0'],
            'effective_from' => ['nullable', 'date'],
        ];
    }
}
