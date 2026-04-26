<?php

namespace App\Services\Contract;

use App\Models\Contract\Contract;
use App\Models\Document\DocumentTemplate;
use App\Models\Document\GeneratedDocument;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;

class ContractDocumentService
{
    // ───────────────────────────────────────────────────────────────────────────
    //  1. OCR SCAN
    // ───────────────────────────────────────────────────────────────────────────

    public function scanContract(UploadedFile $file): array
    {
        $tempPath = $file->store('temp/contract-scans', 'local');

        try {
            $ocrDriver = config('services.ocr.driver', 'mock');

            $result = match ($ocrDriver) {
                'google_vision' => $this->scanWithGoogleVision($tempPath),
                'azure'         => $this->scanWithAzure($tempPath),
                default         => $this->mockScanResult($file->getClientOriginalName()),
            };

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
            Storage::disk('local')->delete($tempPath);
        }
    }

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

        if (preg_match('/(?:Bên B|Người thuê|Họ (và|tên))[ :\t]+([^\n\r,]+)/iu', $rawText, $m)) {
            $result['tenant_name'] = trim($m[2]);
        }
        if (preg_match('/(?:Điện thoại|SĐT|Phone)[ :\t]*([0-9]{9,11})/iu', $rawText, $m)) {
            $result['tenant_phone'] = trim($m[1]);
        }
        if (preg_match('/(?:CCCD|CMND|CMT|Số chứng minh)[ :\t]*([0-9]{9,12})/iu', $rawText, $m)) {
            $result['tenant_id_number'] = trim($m[1]);
        }
        if (preg_match('/(?:Phòng|Room)[ :\t]*([A-Za-z0-9\-\_]+)/iu', $rawText, $m)) {
            $result['room_code'] = trim($m[1]);
        }
        if (preg_match('/(?:Ngày bắt đầu|Từ ngày|Từ)[ :\t]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/iu', $rawText, $m)) {
            $result['start_date'] = $this->parseDate($m[1]);
        }
        if (preg_match('/(?:Ngày kết thúc|Đến ngày|Đến)[ :\t]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/iu', $rawText, $m)) {
            $result['end_date'] = $this->parseDate($m[1]);
        }
        if (preg_match('/(?:Giá thuê|Tiền thuê|Rent)[ :\t]*([0-9][0-9\.,]*)/iu', $rawText, $m)) {
            $result['rent_price'] = (float) str_replace([',', '.'], ['', '.'], $m[1]);
        }
        if (preg_match('/(?:Tiền cọc|Cọc|Deposit)[ :\t]*([0-9][0-9\.,]*)/iu', $rawText, $m)) {
            $result['deposit_amount'] = (float) str_replace([',', '.'], ['', '.'], $m[1]);
        }

        return $result;
    }

    private function parseDate(string $raw): ?string
    {
        try {
            $parts = preg_split('/[\/\-]/', $raw);
            if (count($parts) === 3) {
                [$d, $m, $y] = $parts;
                if (strlen($y) === 2) {
                    $y = '20' . $y;
                }
                return \Carbon\Carbon::createFromDate((int) $y, (int) $m, (int) $d)->format('Y-m-d');
            }
        } catch (\Exception) {}
        return null;
    }

    private function mockScanResult(string $filename = ''): array
    {
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
            '_notice'          => 'OCR provider chưa cấu hình. Trả về kết quả Mock.',
            'user_id'          => $mockUser ? $mockUser->id : null,
            '_db_user_found'   => $mockUser ? true : false,
        ];
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  2. GENERATE DOCUMENT
    // ───────────────────────────────────────────────────────────────────────────

    public function generateDocument(Contract $contract, array $extraData = []): string
    {
        $contractId = $contract->id;

        // Auto-discover signatures if not provided
        if (!isset($extraData['signature_landlord'])) {
            $extraData['signature_landlord'] = $this->findSignaturePath($contractId, 'manager');
        }
        if (!isset($extraData['signature_tenant'])) {
            $extraData['signature_tenant'] = $this->findSignaturePath($contractId, 'tenant');
        }

        $primaryMember = $contract->members?->firstWhere('is_primary', true)
            ?? $contract->members?->first();

        $landlord = $contract->org;

        // --- Đại diện (Bên A) ---
        $creator = $contract->createdBy;
        $representative = null;
        $repRoleStr = 'Đại diện cho thuê';

        if ($creator && ($creator->hasRole('Owner') || $creator->hasRole('Manager'))) {
            $representative = $creator;
            $repRoleStr = $creator->hasRole('Owner') ? 'Chủ sở hữu' : 'Quản lý tòa nhà';
        } else {
            $owner = \App\Models\Org\User::where('org_id', $contract->org_id)
                        ->whereHas('roles', fn($q) => $q->where('name', 'Owner'))
                        ->first();
            if ($owner) {
                $representative = $owner;
                $repRoleStr = 'Chủ sở hữu';
            }
        }

        // --- Dịch vụ phòng ---
        $services = $contract->room?->services ?? [];
        $serviceItems = [];
        if ($services->count() > 0) {
            foreach ($services as $index => $service) {
                $price = number_format((float) $service->current_price, 0, ',', '.');
                $priceStr = $price === '0' ? 'Miễn phí' : "{$price}đ/{$service->unit}";
                $serviceItems[] = ($index + 1) . ". {$service->name}: {$priceStr}";
            }
        } else {
            $serviceItems[] = "Theo quy định chung của tòa nhà";
        }

        $depositMonths = 0;
        if ((float) $contract->rent_price > 0) {
            $depositMonths = round((float) $contract->deposit_amount / (float) $contract->rent_price, 1);
        }

        $vars = array_merge([
            // Contract
            'contract_id'             => $contract->id,
            'contract_status'         => $contract->status?->label() ?? $contract->status,
            'contract_start_date'     => $contract->start_date ? \Carbon\Carbon::parse($contract->start_date)->format('d/m/Y') : '---',
            'contract_end_date'       => $contract->end_date ? \Carbon\Carbon::parse($contract->end_date)->format('d/m/Y') : 'Vô thời hạn',
            'contract_rent_price'     => number_format((float) $contract->rent_price, 0, ',', '.'),
            'contract_deposit_amount' => number_format((float) $contract->deposit_amount, 0, ',', '.'),
            'contract_deposit_months' => $depositMonths,
            'contract_billing_cycle'  => $contract->billing_cycle === 'MONTHLY' ? 'Hàng tháng' : 'Hàng quý',
            'contract_due_day'        => $contract->due_day ?? 5,
            'contract_members_count'  => $contract->members?->count() ?? 0,
            
            // Room
            'room_code'               => $contract->room?->code ?? '---',
            'room_name'               => $contract->room?->name ?? '---',
            'room_capacity'           => $contract->room?->capacity ?? '---',
            'room_area'               => $contract->room?->area ?? '---',
            
            // Property
            'property_name'           => $contract->property?->name ?? '---',
            'property_address'        => $contract->property?->address ?? '...',
            'property_bank_info'      => $this->formatBankInfo($contract->property),
            'property_house_rules'    => $contract->property?->house_rules ?? 'Theo quy định chung của tòa nhà',
            
            // Org (Landlord info)
            'org_name'                => $landlord->name ?? '---',
            'org_phone'               => $landlord->phone ?? '---',
            'org_address'             => $landlord->address ?? '---',
            'org_bank_info'           => $this->formatOrgBankInfo($landlord),

            // Representative
            'rep_full_name'           => $representative?->full_name ?? '---',
            'rep_identity_number'     => $representative?->identity_number ?? '---',
            'rep_identity_issued'     => $representative?->identity_issued_place ?? '---',
            'rep_address'             => $representative?->address ?? '---',
            'rep_phone'               => $representative?->phone ?? '---',
            'rep_role'                => $repRoleStr,

            // Tenant (Fallback to User if snapshot is empty)
            'tenant_full_name'        => $primaryMember?->full_name ?? $primaryMember?->user?->full_name ?? '---',
            'tenant_phone'            => $primaryMember?->phone ?? $primaryMember?->user?->phone ?? '---',
            'tenant_identity_number'  => $primaryMember?->identity_number ?? $primaryMember?->user?->identity_number ?? '---',
            'tenant_dob'              => $primaryMember?->date_of_birth 
                                           ? \Carbon\Carbon::parse($primaryMember->date_of_birth)->format('d/m/Y') 
                                           : ($primaryMember?->user?->date_of_birth 
                                               ? \Carbon\Carbon::parse($primaryMember->user->date_of_birth)->format('d/m/Y') 
                                               : '---'),
            'tenant_license_plate'    => $primaryMember?->license_plate ?? $primaryMember?->user?->license_plate ?? '---',
            'tenant_address'          => $primaryMember?->permanent_address ?? $primaryMember?->user?->address ?? '---',
            
            'created_at'              => now()->format('d/m/Y'),
            'payment_range'           => 'Từ ngày 01 đến ngày 05 hàng tháng',
        ], $extraData);

        // Compute member list early but without final breaks
        $memberLines = $this->getMemberListLines($contract);

        // Map roommates
        $roommates = $contract->members->where('is_primary', false)->values();
        for ($i = 0; $i < 5; $i++) {
            $index = $i + 1;
            $member = $roommates->get($i);
            $vars["roommate_{$index}_name"] = $member?->full_name ?? '';
            $vars["roommate_{$index}_id"]   = $member?->identity_number ?? '';
        }

        // Lookup DocumentTemplate
        $template = DocumentTemplate::active()
            ->where('org_id', $contract->org_id)
            ->where('type', 'CONTRACT')
            ->where(function ($query) use ($contract) {
                $query->where('property_id', $contract->property_id)
                      ->orWhereNull('property_id');
            })
            ->latest()
            ->first();

        // Delegate rendering
        if (!empty($contract->custom_content)) {
            $vars['room_service_list'] = implode("<br/>", $serviceItems);
            $vars['member_list'] = implode("<br/>", $memberLines);
            // Create a fake template to easily reuse the generateHtmlDocument code
            $fakeTemplate = new DocumentTemplate(['content' => $contract->custom_content, 'format' => 'HTML']);
            $storagePath = $this->generateHtmlDocument($contract, $fakeTemplate, $vars);
        } elseif ($template && $template->format === 'HTML') {
            $vars['room_service_list'] = implode("<br/>", $serviceItems);
            $vars['member_list'] = implode("<br/>", $memberLines);
            $storagePath = $this->generateHtmlDocument($contract, $template, $vars);
        } else {
            $vars['room_service_list'] = implode("<w:br/>", $serviceItems);
            $vars['member_list'] = implode("<w:br/>", $memberLines);
            $storagePath = $this->generateDocxDocument($contract, $template, $vars);
        }

        // Log generation history
        GeneratedDocument::create([
            'id' => (string) Str::uuid(),
            'org_id' => $contract->org_id,
            'template_id' => $template?->id,
            'owner_type' => $contract->getMorphClass(),
            'owner_id' => $contract->id,
            'path' => $storagePath,
            'sha256' => hash_file('sha256', Storage::disk('local')->path($storagePath)),
        ]);

        return $storagePath;
    }

    private function generateDocxDocument(Contract $contract, ?DocumentTemplate $template, array $vars): string
    {
        $templatePath = null;

        if ($template && !empty($template->file_path)) {
            $path = Storage::disk('local')->path($template->file_path);
            if (file_exists($path)) {
                $templatePath = $path;
            }
        }

        if (!$templatePath) {
            $templatePath = $this->resolveDefaultDocxPath();
            if (!file_exists($templatePath)) {
                $this->createDefaultDocxTemplate($templatePath);
            }
        }

        $templateProcessor = new TemplateProcessor($templatePath);

        foreach ($vars as $key => $value) {
            if (is_string($value) && str_contains($key, 'signature') && !empty($value) && file_exists(Storage::disk('local')->path($value))) {
                $templateProcessor->setImageValue($key, [
                    'path' => Storage::disk('local')->path($value),
                    'width' => 120,
                    'height' => 60,
                    'ratio' => false
                ]);
            } else {
                $templateProcessor->setValue($key, (string) $value);
            }
        }

        $filename    = 'hop-dong-' . Str::slug($contract->id) . '-' . now()->format('YmdHis') . '.docx';
        $storagePath = 'contracts/documents/' . $filename;
        $fullPath    = Storage::disk('local')->path($storagePath);

        if (! is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        $templateProcessor->saveAs($fullPath);

        return $storagePath;
    }

    private function generateHtmlDocument(Contract $contract, DocumentTemplate $template, array $vars): string
    {
        $html = $template->content ?? '';

        foreach ($vars as $key => $value) {
            if (is_string($value) && str_contains($key, 'signature') && !empty($value) && file_exists(Storage::disk('local')->path($value))) {
                $fullPath = Storage::disk('local')->path($value);
                $type = pathinfo($fullPath, PATHINFO_EXTENSION);
                $data = file_get_contents($fullPath);
                $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
                $imgTag = "<img src='{$base64}' width='120' height='60' />";
                $html = str_replace('${' . $key . '}', $imgTag, $html);
            } else {
                $html = str_replace('${' . $key . '}', (string) $value, $html);
            }
        }

        $pdf = Pdf::loadHTML($html)->setPaper('a4');

        $filename    = 'hop-dong-' . Str::slug($contract->id) . '-' . now()->format('YmdHis') . '.pdf';
        $storagePath = 'contracts/documents/' . $filename;
        $fullPath    = Storage::disk('local')->path($storagePath);

        if (! is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        $pdf->save($fullPath);

        return $storagePath;
    }

    private function formatBankInfo(?\App\Models\Property\Property $property): string
    {
        if (!$property || empty($property->bank_accounts)) {
            return "---";
        }

        return $this->renderBankAccounts($property->bank_accounts);
    }

    private function formatOrgBankInfo(?\App\Models\Org\Org $org): string
    {
        if (!$org || empty($org->bank_accounts)) {
            return "---";
        }

        return $this->renderBankAccounts($org->bank_accounts);
    }

    private function renderBankAccounts($accounts): string
    {
        if (is_string($accounts)) {
            $accounts = json_decode($accounts, true) ?? [];
        }

        if (!is_array($accounts)) {
            return "---";
        }

        $lines = [];
        foreach ($accounts as $acc) {
            $bankName = $acc['bank_name'] ?? $acc['bank'] ?? 'Ngân hàng';
            $accNum   = $acc['account_number'] ?? $acc['account'] ?? '';
            $accName  = $acc['account_holder'] ?? $acc['account_name'] ?? $acc['name'] ?? '';
            
            if ($accNum) {
                $lines[] = "{$bankName}: {$accNum}";
                if ($accName) {
                    $lines[] = "Chủ TK: {$accName}";
                }
            }
        }

        return count($lines) > 0 ? implode("\n", $lines) : "---";
    }

    private function getMemberListLines(Contract $contract): array
    {
        $members = $contract->members;
        if (!$members || $members->isEmpty()) {
            return ["---"];
        }

        $lines = [];
        foreach ($members as $index => $m) {
            $dob = $m->date_of_birth ? \Carbon\Carbon::parse($m->date_of_birth)->format('d/m/Y') : '---';
            $id = $m->identity_number ?? '---';
            $phone = $m->phone ?? '---';
            $plate = $m->license_plate ?? '---';
            
            $text = ($index + 1) . ". " . $m->full_name . " - Ngày sinh: " . $dob . " - CCCD: " . $id . " - SĐT: " . $phone;
            if ($plate !== '---' && !empty($plate)) {
                $text .= " - Biển số xe: " . $plate;
            }
            $lines[] = $text;
        }

        return $lines;
    }

    /**
     * Tìm đường dẫn file chữ ký trên đĩa dựa trên contract_id và role.
     */
    private function findSignaturePath(string $contractId, string $role): ?string
    {
        try {
            $files = Storage::disk('local')->files('contracts/signatures');
            foreach ($files as $file) {
                $basename = basename($file);
                // Khớp với pattern: signature_{role}_{contractId}-{userId}.{ext}
                if (str_starts_with($basename, "signature_{$role}_{$contractId}-")) {
                    return $file;
                }
            }
        } catch (\Exception $e) {
            Log::warning("Error finding signature path: " . $e->getMessage());
        }
        return null;
    }

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

    /**
     * Scan a template for placeholders (e.g. ${variable_name}).
     */
    public function placeholderDiscovery(DocumentTemplate $template): array
    {
        if ($template->format === 'HTML') {
            return $this->discoverHtmlPlaceholders($template->content ?? '');
        }

        return $this->discoverDocxPlaceholders($template->file_path);
    }

    private function discoverHtmlPlaceholders(string $content): array
    {
        preg_match_all('/\$\{([^}]+)\}/', $content, $matches);
        return array_unique($matches[1] ?? []);
    }

    private function discoverDocxPlaceholders(?string $filePath): array
    {
        if (!$filePath) {
            return [];
        }

        $fullPath = Storage::disk('local')->path($filePath);
        if (!file_exists($fullPath)) {
            return [];
        }

        try {
            $templateProcessor = new TemplateProcessor($fullPath);
            return $templateProcessor->getVariables();
        } catch (\Exception $e) {
            Log::error('Failed to discover DOCX placeholders', ['path' => $filePath, 'error' => $e->getMessage()]);
            return [];
        }
    }

    private function resolveDefaultDocxPath(): string
    {
        $customTemplate = storage_path('app/templates/contracts/hop-dong-thue.docx');
        if (file_exists($customTemplate)) {
            return $customTemplate;
        }

        return storage_path('app/templates/contracts/default-contract-v4.docx');
    }

    private function createDefaultDocxTemplate(string $outputPath): void
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

        $section->addText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', ['bold' => true, 'size' => 13], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $section->addText('Độc lập – Tự do – Hạnh phúc', ['bold' => true, 'size' => 13, 'underline' => 'single'], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $section->addText('-----o0o-----', [], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $section->addText('', [], []);
        
        $section->addText('HỢP ĐỒNG THUÊ NHÀ', ['bold' => true, 'size' => 16], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $section->addText('', [], []);

        $section->addText('Hôm nay, ngày ' . date('d') . ' tháng ' . date('m') . ' năm ' . date('Y') . ' tại tòa nhà ${property_name}');
        $section->addText('Địa chỉ: ${property_address}');
        $section->addText('Chúng tôi gồm:');
        
        $section->addText('BÊN CHO THUÊ (BÊN A):', ['bold' => true]);
        $section->addText('Cơ quan/Tổ chức: ${org_name}');
        $section->addText('Đại diện bởi: ${rep_full_name}           Chức vụ: ${rep_role}');
        $section->addText('CCCD số: ${rep_identity_number}           Cấp ngày: ${rep_identity_issued}');
        $section->addText('Địa chỉ thường trú: ${rep_address}');
        $section->addText('Điện thoại: ${rep_phone}');
        $section->addText('');

        $section->addText('BÊN THUÊ NHÀ (BÊN B):', ['bold' => true]);
        $section->addText('Họ và tên: ${tenant_full_name}           Năm sinh: ${tenant_dob}');
        $section->addText('CCCD số: ${tenant_identity_number}           Điện thoại: ${tenant_phone}');
        $section->addText('Địa chỉ HKTT: ${tenant_address}');
        $section->addText('');

        $section->addText('Sau khi hai bên đi đến thống nhất ký kết hợp đồng thuê nhà với các điều kiện và điều khoản sau đây:', ['italic' => true]);
        
        $section->addText('ĐIỀU 1: NỘI DUNG HỢP ĐỒNG', ['bold' => true]); 
        $section->addText('1.1. Bên A đồng ý cho bên B được thuê căn phòng số: ${room_code}, tổng diện tích: ${room_area}m2 thuộc tòa nhà ${property_name}.');
        $section->addText('1.2. Mục đích thuê: Dùng để ở. Sức chứa tối đa: ${room_capacity} người.');
        $section->addText('1.3. Thời hạn thuê: Từ ngày ${contract_start_date} đến ngày ${contract_end_date}.');
        $section->addText('');

        $section->addText('ĐIỀU 2: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN', ['bold' => true]);
        $section->addText('2.1. Giá thuê nhà mỗi tháng là: ${contract_rent_price} VNĐ/tháng.');
        $section->addText('2.2. Tiền đặt cọc: ${contract_deposit_amount} VNĐ (tương đương ${contract_deposit_months} tháng tiền nhà).');
        $section->addText('2.3. Chi phí dịch vụ khác:');
        $section->addText('${room_service_list}');
        $section->addText('2.4. Thời gian thanh toán: ${payment_range}.');
        $section->addText('2.5. Thông tin tài khoản nhận tiền:');
        $section->addText('${property_bank_info}');
        $section->addText('');

        $section->addText('ĐIỀU 3: TRÁCH NHIỆM VÀ QUY ĐỊNH CHUNG', ['bold' => true]);
        $section->addText('3.1. Các quy định về hành vi và vệ sinh:', ['bold' => true]);
        $section->addText('${property_house_rules}');
        $section->addText('3.2. Bên thuê có trách nhiệm bảo quản tốt các tài sản, trang thiết bị trong nhà. Nếu hư hỏng do lỗi người dùng phải bồi thường theo giá thị trường.');
        $section->addText('3.3. Tuyệt đối không được khoan tường, đóng đinh, dán giấy khi chưa được sự đồng ý của Bên A.');
        $section->addText('');

        $section->addText('ĐIỀU 4: CHẤM DỨT HỢP ĐỒNG', ['bold' => true]);
        $section->addText('4.1. Trong trường hợp một trong hai bên muốn chấm dứt hợp đồng trước hạn phải thông báo cho bên kia ít nhất 30 ngày.');
        $section->addText('4.2. Nếu Bên B tự ý chấm dứt hợp đồng mà không báo trước hoặc vi phạm nghiêm trọng các quy định tại Điều 3, Bên A có quyền đơn phương chấm dứt và không hoàn trả tiền đặt cọc.');
        $section->addText('');

        $section->addText('Hợp đồng này được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị pháp lý như nhau.');
        $section->addText('');
        
        $table = $section->addTable(['width' => 100 * 50, 'unit' => 'pct']);
        $table->addRow();
        $table->addCell(5000)->addText('BÊN CHO THUÊ (BÊN A)', ['bold' => true], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $table->addCell(5000)->addText('BÊN THUÊ (BÊN B)', ['bold' => true], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $table->addRow();
        $table->addCell(5000)->addText('${signature_landlord}', ['bold' => true], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);
        $table->addCell(5000)->addText('${signature_tenant}', ['bold' => true], ['alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER]);

        $objWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($outputPath);
    }
}
