<?php

namespace App\Support;

use App\Models\Org\User;

final class OrgUserPhone
{
    /**
     * Chuẩn hóa SĐT để so khớp (bỏ ký tự không phải số; 84xxxxxxxx → 0xxxxxxxx).
     */
    public static function normalize(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if ($digits === '') {
            return trim($phone);
        }

        if (str_starts_with($digits, '84') && strlen($digits) >= 10) {
            $digits = '0'.substr($digits, 2);
        }

        return $digits;
    }

    /**
     * Tìm user trong org trùng SĐT nhưng không khớp email (gây mâu thuẫn khi tạo hợp đồng / đăng ký).
     * Trả về null nếu không có xung đột (kể cả khi trùng SĐT nhưng cùng email).
     */
    public static function findConflictingUserInOrg(string $orgId, ?string $phone, ?string $email): ?User
    {
        $n = self::normalize($phone);
        if ($n === null) {
            return null;
        }

        $emailNorm = $email !== null && trim($email) !== ''
            ? strtolower(trim($email))
            : null;

        $candidates = User::query()
            ->withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereNull('deleted_at')
            ->get(['id', 'email', 'phone', 'full_name']);

        foreach ($candidates as $user) {
            if (self::normalize($user->phone) !== $n) {
                continue;
            }

            if ($emailNorm === null) {
                return $user;
            }

            if (strtolower(trim((string) $user->email)) === $emailNorm) {
                return null;
            }

            return $user;
        }

        return null;
    }
}
