<?php

namespace App\Support;

use Illuminate\Database\QueryException;

final class FriendlySqlDuplicateMessage
{
    public static function fromQueryException(QueryException $e): string
    {
        $msg = $e->getMessage();

        return match (true) {
            str_contains($msg, 'users_email_unique')
                || str_contains($msg, 'users.users_email_unique')
                || (str_contains($msg, 'Duplicate') && str_contains($msg, 'email') && str_contains($msg, 'users')) => 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.',

            str_contains($msg, 'users_org_id_phone_unique')
                || str_contains($msg, 'users.users_org_id_phone_unique') => 'Số điện thoại đã được dùng cho tài khoản khác trong cùng tổ chức. Vui lòng nhập đúng email của tài khoản đó hoặc chọn người dùng từ danh sách.',

            default => 'Thông tin bạn gửi trùng với dữ liệu đã có trong hệ thống. Vui lòng kiểm tra lại.',
        };
    }
}
