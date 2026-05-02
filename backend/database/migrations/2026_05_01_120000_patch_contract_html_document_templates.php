<?php

use App\Models\Document\DocumentTemplate;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Cập nhật mẫu HTML hợp đồng đã lưu trong DB: ngày tạo + placeholder chữ ký.
     * (Seeder mới đã đúng; migration này sửa bản ghi từ môi trường cũ.)
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
            $original = $c;

            $c = preg_replace(
                '/Hôm nay,\s*ngày\s*\$\{created_at\}\s*tại\s*tòa nhà/u',
                '${contract_created_at_vn}, tại tòa nhà',
                $c
            ) ?? $c;

            $c = str_replace('${created_at}', '${contract_created_at_vn}', $c);

            if (! str_contains($c, '${signature_landlord}') && str_contains($c, 'BÊN CHO THUÊ (BÊN A)')) {
                $c = preg_replace(
                    '/(<strong>BÊN CHO THUÊ \(BÊN A\)<\/strong>(?:<br\s*\/?>\s*)+)\$\{rep_full_name\}/u',
                    '$1${signature_landlord}<br/><br/>${rep_full_name}',
                    $c
                ) ?? $c;
            }

            if (! str_contains($c, '${signature_tenant}')) {
                $c = preg_replace(
                    '/(<strong>BÊN THUÊ(?: NHÀ)? \(BÊN B\)<\/strong>(?:<br\s*\/?>\s*)+)\$\{tenant_full_name\}/u',
                    '$1${signature_tenant}<br/><br/>${tenant_full_name}',
                    $c
                ) ?? $c;
            }

            if ($c !== $original) {
                $t->update(['content' => $c]);
            }
        }
    }

    public function down(): void
    {
        // Không hoàn tác.
    }
};
