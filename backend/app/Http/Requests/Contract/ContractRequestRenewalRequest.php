<?php

namespace App\Http\Requests\Contract;

use App\Models\Contract\Contract;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ContractRequestRenewalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requested_end_date' => ['required', 'date', 'after:today'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $contract = $this->route('contract');
            if (! $contract instanceof Contract) {
                return;
            }

            $raw = $this->input('requested_end_date');
            if (! is_string($raw) || $raw === '') {
                return;
            }

            $requested = Carbon::parse($raw)->startOfDay();
            $currentEnd = $contract->end_date ? Carbon::parse($contract->end_date)->startOfDay() : null;

            if ($currentEnd && $requested->lte($currentEnd)) {
                $validator->errors()->add(
                    'requested_end_date',
                    'Ngày kết thúc đề nghị gia hạn phải sau ngày kết thúc hiện tại của hợp đồng.'
                );
            }
        });
    }
}
