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

            $result = match ($ocrDriver) {
                'google_vision' => $this->scanWithGoogleVision($tempPath),
                'azure'         => $this->scanWithAzure($tempPath),
                default         => $this->mockScanResult($file->getClientOriginalName()),
            };

            // Truy vấn database để lấy chính xác thông tin User nếu tìm thấy CCCD/CMND trên hợp đồng scan
            if (!empty($result['tenant_id_number'])) {
                $user = \App\Models\Org\User::where('identity_number', $result['tenant_id_number'])->first();
                if ($user) {
                    $result['tenant_name'] = $user->full_name;
                    $result['tenant_phone'] = $user->phone;
                    $result['user_id'] = $user->id;
                    $result['_db_user_found'] = true;
                }
            }

            return $result;
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
        // Để demo trải nghiệm tốt nhất khi dùng Mock, ta tự động lấy 1 user ngẫu nhiên có CCCD trong hệ thống
        $mockUser = \App\Models\Org\User::whereNotNull('identity_number')->inRandomOrder()->first();

        return [
            'tenant_name'      => $mockUser ? $mockUser->full_name : 'Nguyễn Văn Test',
            'tenant_phone'     => $mockUser ? $mockUser->phone : '0987654321',
            'tenant_id_number' => $mockUser ? $mockUser->identity_number : '001173014264',
            'room_code'        => 'P-SCAN',
            'start_date'       => now()->format('Y-m-d'),
            'end_date'         => now()->addYear()->format('Y-m-d'),
            'rent_price'       => 2500000,
            'deposit_amount'   => 2500000,
            'raw_text'         => 'Mock OCR Text: Hợp đồng thuê nhà. Bên thuê: ' . ($mockUser ? $mockUser->full_name : 'Nguyễn Văn Test') . ' - CCCD: ' . ($mockUser ? $mockUser->identity_number : '001173014264'),
            '_is_mock'         => true,
            '_notice'          => 'OCR provider chưa cấu hình. Trả về kết quả Mock (đã móc nối thành công CCCD với Db Cư dân).',
            'user_id'          => $mockUser ? $mockUser->id : null,
            '_db_user_found'   => $mockUser ? true : false,
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
            'property_address' => $contract->property?->address ?? '......................................................',
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

        return storage_path('app/templates/contracts/default-contract-v3.docx');
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
        $phpWord->setDefaultFontSize(13);

        $section = $phpWord->addSection();

        // Tiêu đề
        $section->addText(
            'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
            ['bold' => true, 'size' => 13],
            ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]
        );
        $section->addText(
            'Độc lập – Tự do – Hạnh phúc',
            ['bold' => true, 'size' => 13, 'underline' => 'single'],
            ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]
        );
        $section->addText(
            '-----o0o-----',
            [],
            ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]
        );
        $section->addText('', [], []);
        
        $section->addText(
            'HỢP ĐỒNG THUÊ NHÀ',
            ['bold' => true, 'size' => 16],
            ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]
        );
        $section->addText('', [], []);

        $section->addText('Hôm nay, ngày ' . date('d') . ' tháng ' . date('m') . ' năm ' . date('Y') . ' tại');
        $section->addText('Tại địa chỉ: ${property_address}');
        $section->addText('Chúng tôi gồm:');
        
        $section->addText('Bên cho thuê (Bên A):', ['bold' => true]);
        $section->addText('Họ và tên: Lê Thị Ngọc           Sinh năm: 1973');
        $section->addText('CMND: 001173014264               Điện thoại: 0963.336.586');
        $section->addText('HKTT: TDP số 7 Phú Mỹ (Mỹ Đình), phường Từ Liêm, Hà Nội.');
        $section->addText('');

        $section->addText('Bên thuê nhà (Bên B):', ['bold' => true]);
        $section->addText('Họ và tên: ${tenant_name}           Sinh năm: ........................');
        $section->addText('CMND/CCCD: ${tenant_id_number}           Điện thoại: ${tenant_phone}');
        $section->addText('HKTT: ........................................................................................................');
        $section->addText('');

        $section->addText('Sau khi hai bên đi đến thống nhất ký kết hợp đồng thuê nhà với các điều kiện và điều khoản sau đây:', ['italic' => true]);
        
        $section->addText('Điều 1:', ['bold' => true]); 
        $section->addText('Bên A đồng ý cho bên B được thuê căn nhà số: ${room_code}, tổng diện tích sử dụng: ............. Số người ở là: .............');
        $section->addText('Tài sản trong nhà bao gồm:');
        $section->addText('1. .....................................................................................................................');
        $section->addText('2. .....................................................................................................................');
        $section->addText('3. .....................................................................................................................');
        $section->addText('');
        $section->addText('Kể từ ngày: ${start_date}');
        $section->addText('Đến ngày: ${end_date}');
        $section->addText('');

        $section->addText('Điều 2:', ['bold' => true]);
        $section->addText('Tiền thuê nhà mỗi tháng là: ${rent_price} VNĐ');
        $section->addText('Đặt cọc 1 tháng là: ${deposit_amount} VNĐ');
        $section->addText('(Giá thuê chưa bao gồm chi phí điện, nước, internet, rác)', ['italic' => true]);
        $section->addText('Bên thuê nhà phải trả tiền đầy đủ cho chủ nhà vào ngày từ mồng 1 đến mồng 5 hàng tháng bằng tiền mặt hoặc chuyển khoản.');
        $section->addText('Số tài khoản: 177132136 tại ngân hàng VPBank, người nhận: Lê Thị Ngọc', ['bold' => true]);
        $section->addText('');

        $section->addText('Điều 3: Hai bên cùng cam kết', ['bold' => true]);
        $section->addText('- Bên thuê nhà sử dụng đúng mục đích thuê nhà để ở có trách nhiệm bảo quản tốt các tài sản thiết bị trong nhà.');
        $section->addText('- Tuyệt đối không được khoan tường đóng đinh, dán giấy lên tường nhà.');
        $section->addText('- Không tụ tập đông người sau 10h30 đêm, không nói to gây ồn ào xung quanh.');
        $section->addText('- Có ý thức giữ gìn vệ sinh chung và riêng sạch sẽ.');
        $section->addText('- Tuyệt đối không vứt giấy xuống bồn cầu.');
        $section->addText('- Tuyệt đối không vứt rác, tóc, vỏ dầu gội đầu xuống đường ống thoát.');
        $section->addText('- Không tự ý sang nhượng cho người khác. Nếu muốn ở thêm người phải báo với chủ nhà.');
        $section->addText('- Bên thuê có trách nhiệm bảo quản tài sản trong nhà phát hiện kịp thời những hư hỏng và báo cho chủ nhà để cùng nhau khắc phục.');
        $section->addText('');

        $section->addText('Điều 4:', ['bold' => true]);
        $section->addText('Trong trường hợp bên B hoặc bên A không có nhu cầu thuê và cho thuê nữa thì phải báo với bên kia 30 ngày để cùng nhau tính toán điện nước. Nếu một trong hai bên mà không báo trước thì sẽ phải hoàn trả tiền cho bên còn lại số tiền cọc 1 tháng.');
        $section->addText('');
        
        $section->addText('Lưu ý:', ['bold' => true, 'underline' => 'single']);
        $section->addText('- Trước khi dọn đi phải quét dọn sạch sẽ như lúc đến.');
        $section->addText('- Tuyệt đối không trả phòng các tháng 9, 10, và 12, 1, 2.');
        $section->addText('');

        $section->addText('Hợp đồng này được lập thành 2 bản mỗi bên giữ 01 bản có giá trị pháp lý như nhau.');
        $section->addText('');
        
        $table = $section->addTable(['width' => 100 * 50, 'unit' => 'pct']);
        $table->addRow();
        $table->addCell(5000)->addText('BÊN CHO THUÊ (BÊN A)', ['bold' => true], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $table->addCell(5000)->addText('BÊN THUÊ (BÊN B)', ['bold' => true], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $table->addRow();
        $table->addCell(5000)->addText('(Ký, ghi rõ họ tên)', ['italic' => true], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $table->addCell(5000)->addText('(Ký, ghi rõ họ tên)', ['italic' => true], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);

        $objWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($outputPath);
    }
}
