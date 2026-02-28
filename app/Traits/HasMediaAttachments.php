<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use App\Models\System\TemporaryUpload;

trait HasMediaAttachments
{
    /**
     * Đồng bộ mảng $mediaIds từ bảng Media sang Model hiện tại
     * 
     * @param array|null $mediaIds Array UUID của Media
     * @param string $collectionName Tên collection đích tới (ví dụ: 'gallery')
     */
    public function syncMediaAttachments(?array $mediaIds, string $collectionName = 'default'): void
    {
        if (!is_array($mediaIds)) {
            return;
        }

        DB::transaction(function () use ($mediaIds, $collectionName) {
            // Lấy ra danh sách các cấu hình upload tạm
            $medias = Media::whereIn('uuid', $mediaIds)
                ->where('model_type', TemporaryUpload::class)
                ->get();
            
            foreach ($medias as $media) {
                // Di chuyển sang Model mới (Ví dụ The Room)
                $media->model_type = get_class($this);
                $media->model_id = $this->id;
                $media->collection_name = $collectionName;
                $media->save();

                // Xóa TemporaryUpload rỗng để dọn dẹp (Optional)
                TemporaryUpload::where('id', $media->model_id)->delete();
            }
        });
    }
}
