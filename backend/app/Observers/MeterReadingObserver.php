<?php

namespace App\Observers;

use App\Models\Meter\MeterReading;
use App\Events\Meter\MeterReadingApproved;
use App\Events\Meter\MeterReadingCreated;
use Illuminate\Support\Facades\Cache;

class MeterReadingObserver
{
    /**
     * Handle the MeterReading "saving" event.
     */
    public function saving(MeterReading $reading): void
    {
        // 1. Tự động tính toán consumption nếu reading_value có sự thay đổi
        if ($reading->isDirty(['reading_value', 'meter_id', 'period_start'])) {
            $this->calculateConsumption($reading);
        }
    }

    /**
     * Handle the MeterReading "created" event.
     */
    public function created(MeterReading $reading): void
    {
        // 2. EDA: Phát sự kiện khởi tạo hoặc duyệt ngay lập tức
        if ($reading->status === 'APPROVED') {
            event(new MeterReadingApproved($reading));
        } else {
            event(new MeterReadingCreated($reading));
        }

        $this->invalidateCache($reading);
    }

    /**
     * Handle the MeterReading "updated" event.
     */
    public function updated(MeterReading $reading): void
    {
        // 3. EDA: Nếu trạng thái chuyển sang APPROVED, kích hoạt bộ máy Billing
        if ($reading->isDirty('status') && $reading->status === 'APPROVED') {
            event(new MeterReadingApproved($reading));
        }

        $this->invalidateCache($reading);
    }

    /**
     * Handle the MeterReading "deleted" event.
     */
    public function deleted(MeterReading $reading): void
    {
        $this->invalidateCache($reading);
    }

    /**
     * Calculate consumption based on previous approved reading.
     */
    protected function calculateConsumption(MeterReading $reading): void
    {
        $prev = MeterReading::where('meter_id', $reading->meter_id)
            ->where('id', '!=', $reading->id)
            ->where('period_end', '<=', $reading->period_start)
            ->where('status', 'APPROVED')
            ->orderBy('period_end', 'desc')
            ->first();

        // Lấy giá trị khởi tạo làm mốc néu chưa có reading cũ
        $meter = $reading->meter;
        $initialReading = $meter->meta['initial_reading'] ?? $meter->base_reading ?? 0;
        $prevValue = $prev ? $prev->reading_value : $initialReading;

        $reading->consumption = $reading->reading_value - $prevValue;

        // Bảo vệ: Tiêu thụ không thể âm
        if ($reading->consumption < 0) {
            // Có thể quăng exception hoặc set bằng 0 tùy business
            // Ở đây ta giữ nguyên giá trị để hệ thống báo lỗi validation nếu cần
        }
    }

    /**
     * Invalidate dashboard and property caches.
     */
    protected function invalidateCache(MeterReading $reading): void
    {
        $propertyId = $reading->meter->property_id ?? null;
        if ($propertyId) {
            Cache::forget("dashboard:property:{$propertyId}:stats");
            Cache::forget("dashboard:owner:stats"); // Cần tinh chỉnh nếu có nhiều owner
        }
    }
}
