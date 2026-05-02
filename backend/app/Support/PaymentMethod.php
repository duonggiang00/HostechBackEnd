<?php

namespace App\Support;

/**
 * Chuẩn hóa & nhãn tiếng Việt cho {@see \App\Models\Finance\Payment::$method}.
 *
 * Giá trị lưu DB khuyến nghị: CASH | BANK_TRANSFER | VNPAY.
 * TRANSFER là legacy — khi tạo mới được normalize thành BANK_TRANSFER.
 */
final class PaymentMethod
{
    /**
     * Chuẩn hóa trước khi ghi DB (create / pending).
     */
    public static function normalize(string $method): string
    {
        return match ($method) {
            'TRANSFER' => 'BANK_TRANSFER',
            default => $method,
        };
    }

    /**
     * Nhãn hiển thị (PDF, API, email).
     */
    public static function labelVi(?string $method): string
    {
        return match ($method) {
            'CASH' => 'Tiền mặt',
            'BANK_TRANSFER', 'TRANSFER' => 'Chuyển khoản',
            'VNPAY' => 'VNPay',
            'WALLET' => 'Ví điện tử',
            'QR' => 'Mã QR',
            null, '' => '—',
            default => $method,
        };
    }
}
