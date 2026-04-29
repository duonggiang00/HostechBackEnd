<?php

namespace App\Support;

use Carbon\Carbon;

/**
 * Tuổi và quy tắc CCCD theo ngày bắt đầu hợp đồng (đồng bộ với FE contractMemberAge).
 */
final class ContractMemberAge
{
    /** Số năm đầy đủ tại ngày tham chiếu, hoặc null nếu thiếu / không parse được. */
    public static function ageAtDate(?string $dob, ?string $referenceDate): ?int
    {
        if (empty($dob) || empty($referenceDate)) {
            return null;
        }

        try {
            $birth = Carbon::parse($dob)->startOfDay();
            $ref = Carbon::parse($referenceDate)->startOfDay();
        } catch (\Throwable) {
            return null;
        }

        return (int) $birth->diffInYears($ref);
    }

    public static function isAdultAtContractStart(?string $dob, string $contractStartDate): bool
    {
        $age = self::ageAtDate($dob, $contractStartDate);

        return $age !== null && $age >= 18;
    }

    /**
     * Có bắt buộc CCCD hai mặt không.
     * Primary: luôn true.
     * Khác: không DOB hợp lệ → true; < 18 → false; ≥ 18 → true.
     */
    public static function requiresIdentity(bool $isPrimary, ?string $dob, string $contractStartDate): bool
    {
        if ($isPrimary) {
            return true;
        }

        $age = self::ageAtDate($dob, $contractStartDate);

        return $age === null || $age >= 18;
    }
}
