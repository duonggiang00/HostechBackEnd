<?php

namespace App\Enums;

enum ContractStatus: string
{
    case DRAFT = 'DRAFT';
    case PENDING_SIGNATURE = 'PENDING_SIGNATURE';
    case PENDING_PAYMENT = 'PENDING_PAYMENT';
    case ACTIVE = 'ACTIVE';
    case PENDING_TERMINATION = 'PENDING_TERMINATION'; // Tenant đã báo dời, chờ Manager thanh lý
    case ENDED = 'ENDED';
    case TERMINATED = 'TERMINATED';
    case CANCELLED = 'CANCELLED';
    case EXPIRED = 'EXPIRED'; // Hết hạn HĐ nhưng chưa được Manager chính thức thanh lý

    /**
     * Các trạng thái cho phép Tenant xác nhận ký.
     */
    public static function allowAcceptSignature(): array
    {
        return [self::DRAFT, self::PENDING_SIGNATURE];
    }

    /**
     * Trạng thái cho phép Admin xác nhận thanh toán.
     */
    public static function allowConfirmPayment(): array
    {
        return [self::PENDING_PAYMENT];
    }

    /**
     * Trạng thái cho phép sửa hợp đồng.
     */
    public static function allowEdit(): array
    {
        return [self::DRAFT, self::PENDING_SIGNATURE, self::PENDING_PAYMENT, self::CANCELLED];
    }

    /**
     * Các trạng thái có thể yêu cầu thanh lý sớm (Tenant báo dời).
     */
    public static function allowRequestTermination(): array
    {
        return [self::ACTIVE];
    }

    /**
     * Các trạng thái mà Manager có thể confirm thanh lý.
     */
    public static function allowTerminate(): array
    {
        return [self::ACTIVE, self::PENDING_TERMINATION, self::EXPIRED];
    }

    /**
     * Trạng thái cuối (đã đóng, không thay đổi được).
     */
    public static function isClosed(): bool
    {
        return in_array(self::TERMINATED, [self::TERMINATED, self::CANCELLED, self::EXPIRED, self::ENDED]);
    }

    /**
     * Danh sách tất cả values (dùng cho validation).
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::DRAFT                => 'Bản nháp',
            self::PENDING_SIGNATURE    => 'Chờ ký',
            self::PENDING_PAYMENT      => 'Chờ thanh toán',
            self::ACTIVE               => 'Đang hiệu lực',
            self::PENDING_TERMINATION  => 'Chờ thanh lý',
            self::ENDED                => 'Đã kết thúc',
            self::TERMINATED           => 'Đã thanh lý',
            self::CANCELLED            => 'Đã huỷ (phạt cọc)',
            self::EXPIRED              => 'Hết hạn (chờ xử lý)',
        };
    }
}
