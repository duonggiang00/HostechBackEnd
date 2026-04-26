<?php

namespace App\Http\Requests\Contract;

use App\Enums\ContractStatus;
use App\Models\Contract\Contract;
use App\Models\Property\Property;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ContractUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string', Rule::in(ContractStatus::values())],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'billing_cycle' => ['nullable', 'integer', 'min:1', 'max:12'],
            'due_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'cutoff_day' => ['nullable', 'integer', 'min:1', 'max:31'],
            'rent_price' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'meta' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $contractId = $this->route('id');
            $contract = $contractId
                ? Contract::query()->select(['id', 'property_id', 'start_date', 'end_date', 'billing_cycle'])->find($contractId)
                : null;

            $startDate = $this->input('start_date') ?? $contract?->start_date;
            $endDate = array_key_exists('end_date', $this->all())
                ? $this->input('end_date')
                : $contract?->end_date;

            if (! $startDate || ! $endDate) {
                return;
            }

            $effectiveBillingCycle = $this->resolveBillingCycleMonths(
                $this->input('billing_cycle')
                ?? $contract?->billing_cycle
                ?? Property::query()->whereKey($contract?->property_id)->value('default_billing_cycle')
                ?? 1
            );

            $minimumEndDate = \Carbon\Carbon::parse($startDate)
                ->addMonths($effectiveBillingCycle)
                ->toDateString();

            if (\Carbon\Carbon::parse($endDate)->lt(\Carbon\Carbon::parse($minimumEndDate))) {
                $validator->errors()->add(
                    'end_date',
                    "Ngày kết thúc không được nhỏ hơn {$minimumEndDate} theo chu kỳ thuê."
                );
            }
        });
    }

    public function attributes(): array
    {
        return [
            'status' => 'Trạng thái',
            'start_date' => 'Ngày bắt đầu',
            'end_date' => 'Ngày kết thúc',
            'rent_price' => 'Giá thuê',
            'deposit_amount' => 'Tiền cọc',
        ];
    }

    private function resolveBillingCycleMonths(string|int|null $billingCycle): int
    {
        return match ((string) $billingCycle) {
            'MONTHLY' => 1,
            'QUARTERLY' => 3,
            'SEMI_ANNUALLY' => 6,
            'YEARLY' => 12,
            default => max(1, (int) $billingCycle),
        };
    }
}
