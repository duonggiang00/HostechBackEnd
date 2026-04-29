<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Models\Org\User;
use App\Models\System\TemporaryUpload;
use Illuminate\Http\UploadedFile;

final class ContractIdentityMedia
{
    /**
     * Tạo hai Media UUID trên TemporaryUpload (mặt trước / mặt sau) để gửi kèm payload tạo hợp đồng / thành viên.
     *
     * @return array{0: string, 1: string}
     */
    public static function uuidPairForUser(User $user): array
    {
        $tmpFront = TemporaryUpload::create(['user_id' => $user->id]);
        $frontUuid = $tmpFront->addMedia(UploadedFile::fake()->image('cccd_front.jpg'))
            ->toMediaCollection('default')
            ->uuid;

        $tmpBack = TemporaryUpload::create(['user_id' => $user->id]);
        $backUuid = $tmpBack->addMedia(UploadedFile::fake()->image('cccd_back.jpg'))
            ->toMediaCollection('default')
            ->uuid;

        return [$frontUuid, $backUuid];
    }
}
