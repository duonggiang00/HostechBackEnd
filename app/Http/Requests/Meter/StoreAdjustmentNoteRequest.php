<?php

namespace App\Http\Requests\Meter;

use App\Models\Meter\MeterReading;
use Illuminate\Foundation\Http\FormRequest;

class StoreAdjustmentNoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:1000'],
            'after_value' => ['required', 'integer', 'min:0'],
            'proof_media_ids' => ['required', 'array', 'min:1'],
            'proof_media_ids.*' => ['uuid', 'exists:temporary_uploads,id'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $meterReading = $this->route('reading');

            if (!$meterReading instanceof MeterReading) {
                // If route model binding isn't set up exactly, fetch it
                $meterReading = MeterReading::find($meterReading);
            }

            if (!$meterReading) {
                $validator->errors()->add('reading', 'Meter reading not found.');
                return;
            }

            // STRICT STATE VALIDATION: Only allow adjustment if the reading is locked
            if (is_null($meterReading->locked_at)) {
                $validator->errors()->add('reading', 'Cannot create adjustment note for an unlocked meter reading. Just update the reading directly.');
            }
        });
    }
}
