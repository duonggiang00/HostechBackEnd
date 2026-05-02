<?php

namespace App\Support;

/**
 * Chuẩn hóa mô tả dòng điện/nước trên hóa đơn (PDF/UI).
 */
final class MeterInvoiceDescription
{
    public static function forUsage(string $serviceName, string $meterType, float|int $usage): string
    {
        $title = preg_replace('/^tiền\s+/iu', '', trim($serviceName));
        $usageStr = ((float) $usage == floor((float) $usage))
            ? (string) (int) $usage
            : rtrim(rtrim(sprintf('%.4f', (float) $usage), '0'), '.');
        $suffix = match ($meterType) {
            'ELECTRIC' => $usageStr.' kWh',
            'WATER' => $usageStr.' m³',
            'GAS' => $usageStr.' m³',
            default => $usageStr,
        };

        return 'Tiền '.$title.' '.$suffix;
    }
}
