<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * @bodyParam effective_from date Ngày bắt đầu áp dụng đơn giá. Example: 2026-03-01
 * @bodyParam tiered_rates object[] Mảng cấu hình giá bậc thang (áp dụng khi calc_mode là PER_METER).
 * @bodyParam tiered_rates[].tier_from int required Mốc bắt đầu. Example: 0
 * @bodyParam tiered_rates[].tier_to int Mốc kết thúc (null là không giới hạn). Example: 50
 * @bodyParam tiered_rates[].price number required Đơn giá cho bậc này. Example: 3000
 */
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
            
            // Tiered rates fields
            'tiered_rates' => ['nullable', 'array'],
            'tiered_rates.*.tier_from' => ['required', 'integer', 'min:0'],
            'tiered_rates.*.tier_to' => ['nullable', 'integer', 'gt:tiered_rates.*.tier_from'],
            'tiered_rates.*.price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
