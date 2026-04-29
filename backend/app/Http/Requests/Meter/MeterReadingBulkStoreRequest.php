<?php

namespace App\Http\Requests\Meter;

use Illuminate\Foundation\Http\FormRequest;

class MeterReadingBulkStoreRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'readings' => ['required', 'array', 'min:1'],
            'readings.*.meter_id' => ['required', 'string', 'exists:meters,id'],
            'readings.*.period_start' => ['required', 'date_format:Y-m-d'],
            'readings.*.period_end' => ['required', 'date_format:Y-m-d', 'after_or_equal:readings.*.period_start'],
            'readings.*.reading_value' => ['required', 'integer', 'min:0'],
            'readings.*.status' => ['nullable', 'string', 'in:DRAFT,SUBMITTED,APPROVED,REJECTED'],
            'readings.*.meta' => ['nullable', 'array'],
            'readings.*.proof_media_ids' => ['nullable', 'array'],
            'readings.*.proof_media_ids.*' => ['string', 'exists:temporary_uploads,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            // readings array
            'readings.required' => 'Dữ liệu chốt số là bắt buộc',
            'readings.array' => 'Dữ liệu chốt số phải là một mảng',
            'readings.min' => 'Phải có ít nhất 1 bản ghi chốt số',

            // meter_id
            'readings.*.meter_id.required' => 'ID đồng hồ là bắt buộc',
            'readings.*.meter_id.string' => 'ID đồng hồ phải là chuỗi ký tự',
            'readings.*.meter_id.exists' => 'Đồng hồ không tồn tại trong hệ thống (ID: :input)',

            // reading_value
            'readings.*.reading_value.required' => 'Chỉ số đồng hồ là bắt buộc',
            'readings.*.reading_value.integer' => 'Chỉ số đồng hồ phải là số nguyên',
            'readings.*.reading_value.min' => 'Chỉ số đồng hồ không được âm',

            // period_start
            'readings.*.period_start.required' => 'Ngày bắt đầu kỳ là bắt buộc',
            'readings.*.period_start.date_format' => 'Ngày bắt đầu kỳ phải theo định dạng YYYY-MM-DD',

            // period_end
            'readings.*.period_end.required' => 'Ngày kết thúc kỳ là bắt buộc',
            'readings.*.period_end.date_format' => 'Ngày kết thúc kỳ phải theo định dạng YYYY-MM-DD',
            'readings.*.period_end.after_or_equal' => 'Ngày kết thúc kỳ phải sau hoặc bằng ngày bắt đầu',

            // status
            'readings.*.status.in' => 'Trạng thái không hợp lệ. Chỉ chấp nhận: DRAFT, SUBMITTED, APPROVED, REJECTED',

            // proof_media_ids
            'readings.*.proof_media_ids.array' => 'Danh sách ảnh chứng minh phải là một mảng',
            'readings.*.proof_media_ids.*.string' => 'ID ảnh chứng minh phải là chuỗi ký tự',
            'readings.*.proof_media_ids.*.exists' => 'Ảnh chứng minh không hợp lệ hoặc đã hết hạn. Vui lòng tải ảnh lại',
        ];
    }
}
