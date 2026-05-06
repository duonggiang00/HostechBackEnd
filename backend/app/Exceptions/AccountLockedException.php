<?php

namespace App\Exceptions;

use Exception;

class AccountLockedException extends Exception
{
    public function __construct(
        string $message = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản lý để được mở lại.',
    ) {
        parent::__construct($message);
    }
}
