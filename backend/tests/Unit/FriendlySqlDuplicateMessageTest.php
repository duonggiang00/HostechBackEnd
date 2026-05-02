<?php

namespace Tests\Unit;

use App\Support\FriendlySqlDuplicateMessage;
use Illuminate\Database\QueryException;
use PDOException;
use Tests\TestCase;

class FriendlySqlDuplicateMessageTest extends TestCase
{
    public function test_maps_email_unique_to_vietnamese_message(): void
    {
        $e = $this->makeQueryException("SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry 'a@b.com' for key 'users.users_email_unique'");

        $this->assertStringContainsString('Email', FriendlySqlDuplicateMessage::fromQueryException($e));
        $this->assertStringContainsString('đăng ký', FriendlySqlDuplicateMessage::fromQueryException($e));
    }

    public function test_maps_phone_unique_legacy_key(): void
    {
        $e = $this->makeQueryException("Duplicate entry 'x-y' for key 'users.users_org_id_phone_unique'");

        $this->assertStringContainsString('Số điện thoại', FriendlySqlDuplicateMessage::fromQueryException($e));
    }

    private function makeQueryException(string $message): QueryException
    {
        return new QueryException(
            'mysql',
            'insert into users',
            [],
            new PDOException($message, '23000')
        );
    }
}
