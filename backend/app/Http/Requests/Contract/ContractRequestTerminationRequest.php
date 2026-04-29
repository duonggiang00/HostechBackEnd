<?php

namespace App\Http\Requests\Contract;

use App\Models\Contract\Contract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

class ContractRequestTerminationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'expected_move_out_date' => ['required', 'date', 'after_or_equal:today'],
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

            $raw = $this->input('expected_move_out_date');
            if (! is_string($raw) || $raw === '' || ! $contract->end_date) {
                return;
            }

            $tz = config('app.timezone');
            $expected = Carbon::parse($raw, $tz)->startOfDay();
            $end = Carbon::parse($contract->end_date)->copy()->timezone($tz)->startOfDay();

            if ($expected->gt($end)) {
                $validator->errors()->add(
                    'expected_move_out_date',
                    'Ngày dự kiến dọn đi không được sau ngày kết thúc hợp đồng.'
                );
            }
        });
    }
}
