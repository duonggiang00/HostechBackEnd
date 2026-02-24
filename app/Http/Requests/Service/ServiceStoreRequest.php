<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServiceStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;

        return [
            'code' => [
                'required', 
                'string', 
                'max:50', 
                // Unique code per Org
                Rule::unique('services')->where(function ($query) use ($orgId) {
                    return $query->where('org_id', $orgId);
                })
            ],
            'name' => ['required', 'string', 'max:255'],
            'calc_mode' => ['required', 'string', 'in:PER_ROOM,PER_PERSON,PER_QUANTITY,PER_METER'],
            'unit' => ['required', 'string', 'max:20'],
            'is_recurring' => ['boolean'],
            'is_active' => ['boolean'],
            
            // Rate fields
            'price' => ['required', 'numeric', 'min:0'],
            'effective_from' => ['nullable', 'date'],
        ];
    }
}
