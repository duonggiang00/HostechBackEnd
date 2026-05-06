<?php

use App\Models\Document\DocumentTemplate;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Thêm placeholder ${room_asset_list} vào mẫu HTML hợp đồng đã lưu trong DB.
     * (Seeder mới đã đúng; migration này sửa các bản ghi từ môi trường cũ.)
     */
    public function up(): void
    {
        foreach (
            DocumentTemplate::query()
                ->where('type', 'CONTRACT')
                ->where('format', 'HTML')
                ->whereNotNull('content')
                ->cursor() as $t
        ) {
            $c = (string) $t->content;

            if (str_contains($c, '${room_asset_list}')) {
                continue;
            }

            // Chèn mục 1.4 tài sản bàn giao ngay trước ĐIỀU 2
            $insertion = "\n                            <p>1.4. Tài sản bàn giao kèm phòng:</p>\n"
                ."                            <div style=\"margin-left: 20px;\">\${room_asset_list}</div>\n\n";

            $c = preg_replace(
                '/(<h4[^>]*>\s*ĐIỀU 2[^<]*<\/h4>)/u',
                $insertion.'$1',
                $c
            ) ?? $c;

            if (! str_contains($c, '${room_asset_list}')) {
                // Fallback: chèn sau dòng contract_end_date nếu không tìm thấy ĐIỀU 2
                $c = str_replace(
                    '${contract_end_date}.</p>',
                    "\${contract_end_date}.</p>\n                            <p>1.4. Tài sản bàn giao kèm phòng:</p>\n"
                    .'                            <div style="margin-left: 20px;">${room_asset_list}</div>',
                    $c
                );
            }

            $t->update(['content' => $c]);
        }
    }

    public function down(): void
    {
        // Không hoàn tác – thêm placeholder không phá vỡ template cũ.
    }
};
