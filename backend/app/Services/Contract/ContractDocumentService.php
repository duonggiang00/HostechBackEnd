<?php

namespace App\Services\Contract;

use App\Models\Contract\Contract;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;

class ContractDocumentService
{
    // ───────────────────────────────────────────────────────────────────────────
    //  1. OCR SCAN — Upload ảnh/PDF scan hợp đồng, trả về data trích xuất
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Nhận file scan (image hoặc PDF), gửi lên OCR service và trả về structured data.
     *
     * Trả về array:
     * [
     *   'tenant_name'      => string|null,
     *   'tenant_phone'     => string|null,
     *   'tenant_id_number' => string|null,
     *   'room_code'        => string|null,
     *   'start_date'       => string|null,  // định dạng Y-m-d nếu parse được
     *   'end_date'         => string|null,
     *   'rent_price'       => float|null,
     *   'deposit_amount'   => float|null,
     *   'raw_text'         => string,       // toàn bộ text OCR thô (để debug/hiển thị)
     *   '_is_mock'         => bool,         // true nếu dùng mock (chưa cấu hình OCR)
     * ]
     */
    public function scanContract(UploadedFile $file): array
    {
        // Lưu file tạm để gửi lên OCR
        $tempPath = $file->store('temp/contract-scans', 'local');

        try {
            $ocrDriver = config('services.ocr.driver', 'mock');

            return match ($ocrDriver) {
                'google_vision' => $this->scanWithGoogleVision($tempPath),
                'azure'         => $this->scanWithAzure($tempPath),
                default         => $this->mockScanResult($file->getClientOriginalName()),
            };
        } finally {
            // Dọn file tạm
            Storage::disk('local')->delete($tempPath);
        }
    }

    /**
     * Google Cloud Vision OCR (cần cấu hình GOOGLE_VISION_API_KEY)
     */
    private function scanWithGoogleVision(string $tempPath): array
    {
        $apiKey  = config('services.ocr.google_vision_key');
        $content = base64_encode(Storage::disk('local')->get($tempPath));

        $response = Http::timeout(30)->post(
            "https://vision.googleapis.com/v1/images:annotate?key={$apiKey}",
            [
                'requests' => [[
                    'image'    => ['content' => $content],
                    'features' => [['type' => 'DOCUMENT_TEXT_DETECTION']],
                ]],
            ]
        );

        if (! $response->successful()) {
            Log::warning('Google Vision OCR failed', ['status' => $response->status()]);
            return $this->mockScanResult();
        }

        $rawText = $response->json('responses.0.fullTextAnnotation.text', '');

        return $this->parseRawText($rawText);
    }

    /**
     * Azure Cognitive Services OCR
     */
    private function scanWithAzure(string $tempPath): array
    {
        $endpoint    = config('services.ocr.azure_endpoint');
        $key         = config('services.ocr.azure_key');
        $fileContent = Storage::disk('local')->get($tempPath);

        $response = Http::withHeaders([
            'Ocp-Apim-Subscription-Key' => $key,
            'Content-Type'              => 'application/octet-stream',
        ])
        ->timeout(30)
        ->withBody($fileContent, 'application/octet-stream')
        ->post("{$endpoint}/vision/v3.2/read/analyze");

        if (! $response->successful()) {
            return $this->mockScanResult();
        }

        // Azure Read API là async → poll result
        $operationUrl = $response->header('Operation-Location');
        $rawText      = $this->pollAzureReadResult($operationUrl, $key);

        return $this->parseRawText($rawText);
    }

    private function pollAzureReadResult(string $operationUrl, string $key, int $maxRetries = 10): string
    {
        for ($i = 0; $i < $maxRetries; $i++) {
            sleep(1);
            $result = Http::withHeaders(['Ocp-Apim-Subscription-Key' => $key])
                ->get($operationUrl);

            if ($result->json('status') === 'succeeded') {
                $lines = [];
                foreach ($result->json('analyzeResult.readResults', []) as $page) {
                    foreach ($page['lines'] ?? [] as $line) {
                        $lines[] = $line['text'];
                    }
                }
                return implode("\n", $lines);
            }
        }

        return '';
    }

    /**
     * Parse raw OCR text để extract structured fields.
     * Dùng regex đơn giản – có thể nâng cấp lên LLM structured extraction sau.
     */
    private function parseRawText(string $rawText): array
    {
        $result = [
            'tenant_name'      => null,
            'tenant_phone'     => null,
            'tenant_id_number' => null,
            'room_code'        => null,
            'start_date'       => null,
            'end_date'         => null,
            'rent_price'       => null,
            'deposit_amount'   => null,
            'raw_text'         => $rawText,
            '_is_mock'         => false,
        ];

        // Tên người thuê
        if (preg_match('/(?:Bên B|Người thuê|Họ (và|tên))[ :\t]+([^\n\r,]+)/iu', $rawText, $m)) {
            $result['tenant_name'] = trim($m[2]);
        }

        // Số điện thoại
        if (preg_match('/(?:Điện thoại|SĐT|Phone)[ :\t]*([0-9]{9,11})/iu', $rawText, $m)) {
            $result['tenant_phone'] = trim($m[1]);
        }

        // CCCD/CMND
        if (preg_match('/(?:CCCD|CMND|CMT|Số chứng minh)[ :\t]*([0-9]{9,12})/iu', $rawText, $m)) {
            $result['tenant_id_number'] = trim($m[1]);
        }

        // Mã phòng
        if (preg_match('/(?:Phòng|Room)[ :\t]*([A-Za-z0-9\-\_]+)/iu', $rawText, $m)) {
            $result['room_code'] = trim($m[1]);
        }

        // Ngày bắt đầu
        if (preg_match('/(?:Ngày bắt đầu|Từ ngày|Từ)[ :\t]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/iu', $rawText, $m)) {
            $result['start_date'] = $this->parseDate($m[1]);
        }

        // Ngày kết thúc
        if (preg_match('/(?:Ngày kết thúc|Đến ngày|Đến)[ :\t]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/iu', $rawText, $m)) {
            $result['end_date'] = $this->parseDate($m[1]);
        }

        // Giá thuê
        if (preg_match('/(?:Giá thuê|Tiền thuê|Rent)[ :\t]*([0-9][0-9\.,]*)/iu', $rawText, $m)) {
            $result['rent_price'] = (float) str_replace([',', '.'], ['', '.'], $m[1]);
        }

        // Tiền cọc
        if (preg_match('/(?:Tiền cọc|Cọc|Deposit)[ :\t]*([0-9][0-9\.,]*)/iu', $rawText, $m)) {
            $result['deposit_amount'] = (float) str_replace([',', '.'], ['', '.'], $m[1]);
        }

        return $result;
    }

    private function parseDate(string $raw): ?string
    {
        try {
            // Thử dd/mm/yyyy hoặc dd-mm-yyyy
            $parts = preg_split('/[\/\-]/', $raw);
            if (count($parts) === 3) {
                [$d, $m, $y] = $parts;
                if (strlen($y) === 2) {
                    $y = '20' . $y;
                }
                return \Carbon\Carbon::createFromDate((int) $y, (int) $m, (int) $d)->format('Y-m-d');
            }
        } catch (\Exception) {
        }

        return null;
    }

    /**
     * Mock kết quả scan (dùng khi chưa cấu hình OCR provider)
     */
    private function mockScanResult(string $filename = ''): array
    {
        return [
            'tenant_name'      => null,
            'tenant_phone'     => null,
            'tenant_id_number' => null,
            'room_code'        => null,
            'start_date'       => null,
            'end_date'         => null,
            'rent_price'       => null,
            'deposit_amount'   => null,
            'raw_text'         => '',
            '_is_mock'         => true,
            '_notice'          => 'OCR provider chưa được cấu hình. Set SERVICES_OCR_DRIVER trong .env để kích hoạt.',
        ];
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  2. GENERATE DOCUMENT — Tạo file DOCX từ template, lưu vào Storage
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Tạo file DOCX từ template hợp đồng và lưu vào storage.
     * Trả về path tương đối trong disk 'local'.
     *
     * Template phải nằm tại: storage/app/templates/contracts/hop-dong-thue.docx
     * Các placeholder trong template dùng cú pháp: ${ten_truong}
     */
    public function generateDocument(Contract $contract, array $extraData = []): string
    {
        $templatePath = $this->resolveTemplatePath();

        if (! file_exists($templatePath)) {
            // Tạo template mẫu tự động nếu chưa có
            $this->createDefaultTemplate($templatePath);
        }

        $templateProcessor = new TemplateProcessor($templatePath);

        // Build variable map
        $primaryMember = $contract->members?->firstWhere('is_primary', true)
            ?? $contract->members?->first();

        $vars = array_merge([
            'contract_id'      => $contract->id,
            'status'           => $contract->status?->label() ?? $contract->status,
            'property_name'    => $contract->property?->name ?? '---',
            'room_code'        => $contract->room?->code ?? '---',
            'room_name'        => $contract->room?->name ?? '---',
            'start_date'       => $contract->start_date ? \Carbon\Carbon::parse($contract->start_date)->format('d/m/Y') : '---',
            'end_date'         => $contract->end_date ? \Carbon\Carbon::parse($contract->end_date)->format('d/m/Y') : 'Vô thời hạn',
            'rent_price'       => number_format((float) $contract->rent_price, 0, ',', '.'),
            'deposit_amount'   => number_format((float) $contract->deposit_amount, 0, ',', '.'),
            'billing_cycle'    => $contract->billing_cycle === 'MONTHLY' ? 'Hàng tháng' : 'Hàng quý',
            'due_day'          => $contract->due_day ?? 5,
            'tenant_name'      => $primaryMember?->full_name ?? '---',
            'tenant_phone'     => $primaryMember?->phone ?? '---',
            'tenant_id_number' => $primaryMember?->identity_number ?? '---',
            'created_at'       => now()->format('d/m/Y'),
        ], $extraData);

        foreach ($vars as $key => $value) {
            $templateProcessor->setValue($key, (string) $value);
        }

        // Lưu file output
        $filename    = 'hop-dong-' . Str::slug($contract->id) . '-' . now()->format('YmdHis') . '.docx';
        $storagePath = 'contracts/documents/' . $filename;
        $fullPath    = Storage::disk('local')->path($storagePath);

        // Đảm bảo thư mục tồn tại
        if (! is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        $templateProcessor->saveAs($fullPath);

        return $storagePath;
    }

    /**
     * Lấy đường dẫn đầy đủ của file document thuộc contract.
     * Ném exception nếu không tìm thấy.
     */
    public function getDocumentFullPath(Contract $contract): string
    {
        if (! $contract->document_path) {
            throw new \RuntimeException('Hợp đồng này chưa có file tài liệu. Vui lòng tạo file tài liệu trước.');
        }

        $fullPath = Storage::disk('local')->path($contract->document_path);

        if (! file_exists($fullPath)) {
            throw new \RuntimeException('File tài liệu không tồn tại trên server. Vui lòng tạo lại.');
        }

        return $fullPath;
    }

    private function resolveTemplatePath(): string
    {
        $customTemplate = storage_path('app/templates/contracts/hop-dong-thue.docx');
        if (file_exists($customTemplate)) {
            return $customTemplate;
        }

        return storage_path('app/templates/contracts/default-contract.docx');
    }

    /**
     * Tạo template DOCX mặc định bằng PhpWord (không cần file bên ngoài).
     */
    private function createDefaultTemplate(string $outputPath): void
    {
        if (! class_exists(\PhpOffice\PhpWord\PhpWord::class)) {
            throw new \RuntimeException(
                'Package phpoffice/phpword chưa được cài. Chạy: composer require phpoffice/phpword'
            );
        }

        $dir = dirname($outputPath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $phpWord->setDefaultFontName('Times New Roman');
        $phpWord->setDefaultFontSize(12);

        $section = $phpWord->addSection();

        // Tiêu đề
        $section->addText(
            'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
            ['bold' => true, 'size' => 13],
            ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]
        );
        $section->addText(
            'Độc lập – Tự do – Hạnh phúc',
            ['italic' => true],
            ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]
        );
        $section->addText('', [], []);
        $section->addText(
            'HỢP ĐỒNG THUÊ PHÒNG',
            ['bold' => true, 'size' => 14],
            ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]
        );
        $section->addText(
            'Mã hợp đồng: ${contract_id}',
            [],
            ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]
        );
        $section->addText('', [], []);

        // Các điều khoản chính
        $lines = [
            'BÊN CHO THUÊ: ${property_name}',
            '',
            'BÊN THUÊ (BÊN B):',
            '  Họ và tên: ${tenant_name}',
            '  Số điện thoại: ${tenant_phone}',
            '  CCCD/CMND: ${tenant_id_number}',
            '',
            'ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG',
            '  Bên A đồng ý cho Bên B thuê phòng: ${room_code} - ${room_name}',
            '  Thuộc tòa nhà: ${property_name}',
            '',
            'ĐIỀU 2: THỜI GIAN THUÊ',
            '  Từ ngày: ${start_date}',
            '  Đến ngày: ${end_date}',
            '',
            'ĐIỀU 3: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN',
            '  Giá thuê: ${rent_price} VNĐ / tháng',
            '  Tiền đặt cọc: ${deposit_amount} VNĐ',
            '  Chu kỳ thanh toán: ${billing_cycle}',
            '  Ngày thanh toán: ngày ${due_day} hàng tháng',
            '',
            '',
            'Ngày tạo: ${created_at}',
            '',
            'BÊN A                              BÊN B',
            '(Ký, ghi rõ họ tên)               (Ký, ghi rõ họ tên)',
        ];

        foreach ($lines as $line) {
            $section->addText(htmlspecialchars($line));
        }

        $objWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($outputPath);
    }
}
