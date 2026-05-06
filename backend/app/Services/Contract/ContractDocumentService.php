<?php

namespace App\Services\Contract;

use App\Models\Contract\Contract;
use App\Models\Document\DocumentTemplate;
use App\Models\Document\GeneratedDocument;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;
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
                'azure' => $this->scanWithAzure($tempPath),
                default => $this->mockScanResult($file->getClientOriginalName()),
            };

            if (! empty($result['tenant_id_number'])) {
                $user = User::where('identity_number', $result['tenant_id_number'])->first();
                if ($user) {
                    $result['tenant_full_name'] = $user->full_name;
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
        $apiKey = config('services.ocr.google_vision_key');
        $content = base64_encode(Storage::disk('local')->get($tempPath));

        $response = Http::timeout(30)->post(
            "https://vision.googleapis.com/v1/images:annotate?key={$apiKey}",
            [
                'requests' => [[
                    'image' => ['content' => $content],
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
        $endpoint = config('services.ocr.azure_endpoint');
        $key = config('services.ocr.azure_key');
        $fileContent = Storage::disk('local')->get($tempPath);

        $response = Http::withHeaders([
            'Ocp-Apim-Subscription-Key' => $key,
            'Content-Type' => 'application/octet-stream',
        ])
            ->timeout(30)
            ->withBody($fileContent, 'application/octet-stream')
            ->post("{$endpoint}/vision/v3.2/read/analyze");

        if (! $response->successful()) {
            return $this->mockScanResult();
        }

        $operationUrl = $response->header('Operation-Location');
        $rawText = $this->pollAzureReadResult($operationUrl, $key);

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
            'tenant_full_name' => null,
            'tenant_phone' => null,
            'tenant_id_number' => null,
            'room_code' => null,
            'start_date' => null,
            'end_date' => null,
            'rent_price' => null,
            'deposit_amount' => null,
            'raw_text' => $rawText,
            '_is_mock' => false,
        ];

        if (preg_match('/(?:Bên B|Người thuê|Họ (và|tên))[ :\t]+([^\n\r,]+)/iu', $rawText, $m)) {
            $result['tenant_full_name'] = trim($m[2]);
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
                    $y = '20'.$y;
                }

                return Carbon::createFromDate((int) $y, (int) $m, (int) $d)->format('Y-m-d');
            }
        } catch (\Exception) {
        }

        return null;
    }

    private function mockScanResult(string $filename = ''): array
    {
        $mockUser = User::whereNotNull('identity_number')->inRandomOrder()->first();

        return [
            'tenant_full_name' => $mockUser ? $mockUser->full_name : 'Nguyễn Văn Test',
            'tenant_phone' => $mockUser ? $mockUser->phone : '0987654321',
            'tenant_id_number' => $mockUser ? $mockUser->identity_number : '001173014264',
            'room_code' => 'P-SCAN',
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->addYear()->format('Y-m-d'),
            'rent_price' => 2500000,
            'deposit_amount' => 2500000,
            'raw_text' => 'Mock OCR Text: Hợp đồng thuê nhà. Bên thuê: '.($mockUser ? $mockUser->full_name : 'Nguyễn Văn Test').' - CCCD: '.($mockUser ? $mockUser->identity_number : '001173014264'),
            '_is_mock' => true,
            '_notice' => 'OCR provider chưa cấu hình. Trả về kết quả Mock.',
            'user_id' => $mockUser ? $mockUser->id : null,
            '_db_user_found' => $mockUser ? true : false,
        ];
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  Billing cycle labels (align with ContractService / RecurringBillingService)
    // ───────────────────────────────────────────────────────────────────────────

    private function resolveContractBillingCycleMonths(?string $billingCycle): int
    {
        return match ((string) $billingCycle) {
            'MONTHLY' => 1,
            'QUARTERLY' => 3,
            'SEMI_ANNUALLY' => 6,
            'YEARLY' => 12,
            default => max(1, (int) $billingCycle),
        };
    }

    private function billingCycleLabelVi(int $months): string
    {
        return match ($months) {
            1 => 'Hàng tháng',
            3 => 'Hàng quý (mỗi 3 tháng)',
            6 => 'Hàng nửa năm (mỗi 6 tháng)',
            12 => 'Hàng năm (mỗi 12 tháng)',
            default => "Mỗi {$months} tháng thanh toán một lần",
        };
    }

    private function paymentRangeDescription(int $months, int $dueDay): string
    {
        if ($months === 1) {
            return "Trước ngày {$dueDay} hàng tháng";
        }

        return "Bên B thanh toán đủ tiền phòng và các khoản ghi trong hợp đồng trước ngày {$dueDay} của tháng đầu mỗi chu kỳ {$months} tháng";
    }

    /**
     * Danh sách tài sản phòng cho placeholder ${room_asset_list} (HTML / DOCX).
     *
     * @return array<int, string>
     */
    private function buildRoomAssetInventoryLines(Contract $contract): array
    {
        $assets = $contract->room?->assets;
        if ($assets === null || $assets->isEmpty()) {
            return ['Không có danh mục tài sản được khai báo trên hệ thống (hai bên ghi nhận hiện trạng khi bàn giao).'];
        }

        $lines = [];
        foreach ($assets->values() as $index => $asset) {
            $n = $index + 1;
            $name = $asset->name ?: 'Tài sản';
            $line = "{$n}. {$name}";
            $extras = [];
            if ($asset->serial) {
                $extras[] = 'S/N: '.$asset->serial;
            }
            if ($asset->condition) {
                $extras[] = 'Tình trạng: '.$asset->condition;
            }
            if ($asset->note) {
                $extras[] = 'Ghi chú: '.$asset->note;
            }
            if ($extras !== []) {
                $line .= ' — '.implode(' — ', $extras);
            }
            $lines[] = $line;
        }

        return $lines;
    }

    /**
     * @return array{0: array<string, mixed>, 1: array<int, string>, 2: array<int, string>}
     */
    private function composeDocumentVariables(Contract $contract, array $extraData = []): array
    {
        $primaryMember = $contract->members?->firstWhere('is_primary', true)
            ?? $contract->members?->first();

        $landlord = $contract->org;

        $creator = $contract->createdBy;
        $representative = null;
        $repRoleStr = 'Đại diện cho thuê';

        if ($creator && ($creator->hasRole('Owner') || $creator->hasRole('Manager'))) {
            $representative = $creator;
            $repRoleStr = $creator->hasRole('Owner') ? 'Chủ sở hữu' : 'Quản lý tòa nhà';
        } else {
            $owner = User::where('org_id', $contract->org_id)
                ->whereHas('roles', fn ($q) => $q->where('name', 'Owner'))
                ->first();
            if ($owner) {
                $representative = $owner;
                $repRoleStr = 'Chủ sở hữu';
            }
        }

        $services = $contract->room?->services ?? [];
        $serviceItems = [];
        if ($services->count() > 0) {
            foreach ($services as $index => $service) {
                $price = number_format((float) $service->current_price, 0, ',', '.');
                $priceStr = $price === '0' ? 'Miễn phí' : "{$price}đ/{$service->unit}";
                $serviceItems[] = ($index + 1).". {$service->name}: {$priceStr}";
            }
        } else {
            $serviceItems[] = 'Theo quy định chung của tòa nhà';
        }

        $assetItems = $this->buildRoomAssetInventoryLines($contract);

        $cycleMonths = $this->resolveContractBillingCycleMonths($contract->billing_cycle);
        $dueDay = (int) ($contract->due_day ?? 5);
        $billingLabel = $this->billingCycleLabelVi($cycleMonths);
        $paymentRange = $this->paymentRangeDescription($cycleMonths, $dueDay);

        // Khớp API/UI: tin `deposit_months` khi khớp tiền; nếu lệch thì suy từ deposit / total_rent.
        $depositMonths = (float) $contract->effectiveDepositMonths();

        $createdAt = $contract->created_at ? Carbon::parse($contract->created_at) : Carbon::now();
        $contractCreatedAtVn = sprintf(
            'Ngày %d tháng %d năm %d',
            (int) $createdAt->format('j'),
            (int) $createdAt->format('n'),
            (int) $createdAt->format('Y')
        );
        $createdAtPlainVn = sprintf(
            '%d tháng %d năm %d',
            (int) $createdAt->format('j'),
            (int) $createdAt->format('n'),
            (int) $createdAt->format('Y')
        );

        $baseRent = (float) ($contract->base_rent ?? $contract->rent_price);
        $fixedFee = (float) ($contract->fixed_services_fee ?? 0);
        $totalRent = (float) ($contract->total_rent ?? ($baseRent + $fixedFee));

        $vars = array_merge([
            'contract_id' => $contract->id,
            'contract_status' => $contract->status?->label() ?? $contract->status,
            'contract_start_date' => $contract->start_date ? Carbon::parse($contract->start_date)->format('d/m/Y') : '---',
            'contract_end_date' => $contract->end_date ? Carbon::parse($contract->end_date)->format('d/m/Y') : 'Vô thời hạn',
            'contract_rent_price' => number_format((float) $contract->rent_price, 0, ',', '.'),
            'contract_base_rent' => number_format($baseRent, 0, ',', '.'),
            'contract_fixed_services_fee' => number_format($fixedFee, 0, ',', '.'),
            'contract_total_rent' => number_format($totalRent, 0, ',', '.'),
            'contract_deposit_amount' => number_format((float) $contract->deposit_amount, 0, ',', '.'),
            'contract_deposit_months' => $depositMonths,
            'contract_billing_cycle' => $billingLabel,
            'contract_billing_cycle_label' => $billingLabel,
            'contract_due_day' => $dueDay,
            'contract_members_count' => $contract->members?->count() ?? 0,
            'contract_created_at_vn' => $contractCreatedAtVn,
            'created_at' => $createdAtPlainVn,
            'payment_range' => $paymentRange,

            'room_code' => $contract->room?->code ?? '---',
            'room_name' => $contract->room?->name ?? '---',
            'room_capacity' => $contract->room?->capacity ?? '---',
            'room_area' => $contract->room?->area ?? '---',

            'property_name' => $contract->property?->name ?? '---',
            'property_address' => $contract->property?->address ?? '...',
            'property_bank_info' => $this->formatBankInfo($contract->property),
            'property_house_rules' => $contract->property?->house_rules ?? 'Theo quy định chung của tòa nhà',

            'org_name' => $landlord->name ?? '---',
            'org_phone' => $landlord->phone ?? '---',
            'org_address' => $landlord->address ?? '---',
            'org_bank_info' => $this->formatOrgBankInfo($landlord),

            'rep_full_name' => $representative?->full_name ?? '---',
            'rep_identity_number' => $representative?->identity_number ?? '---',
            'rep_identity_issued' => $representative?->identity_issued_place ?? '---',
            'rep_address' => $representative?->address ?? '---',
            'rep_phone' => $representative?->phone ?? '---',
            'rep_role' => $repRoleStr,

            'tenant_full_name' => $primaryMember?->full_name ?? $primaryMember?->user?->full_name ?? '---',
            'tenant_phone' => $primaryMember?->phone ?? $primaryMember?->user?->phone ?? '---',
            'tenant_identity_number' => $primaryMember?->identity_number ?? $primaryMember?->user?->identity_number ?? '---',
            'tenant_dob' => $primaryMember?->date_of_birth
                                           ? Carbon::parse($primaryMember->date_of_birth)->format('d/m/Y')
                                           : ($primaryMember?->user?->date_of_birth
                                               ? Carbon::parse($primaryMember->user->date_of_birth)->format('d/m/Y')
                                               : '---'),
            'tenant_license_plate' => $primaryMember?->license_plate ?? $primaryMember?->user?->license_plate ?? '---',
            'tenant_address' => $primaryMember?->permanent_address ?? $primaryMember?->user?->address ?? '---',

        ], $extraData);

        return [$vars, $serviceItems, $assetItems];
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  2. GENERATE DOCUMENT
    // ───────────────────────────────────────────────────────────────────────────

    public function generateDocument(Contract $contract, array $extraData = []): string
    {
        $contractId = $contract->id;

        // Auto-discover signatures if not provided
        if (! isset($extraData['signature_landlord'])) {
            $extraData['signature_landlord'] = $this->findSignaturePath($contractId, 'manager');
        }
        if (! isset($extraData['signature_tenant'])) {
            $extraData['signature_tenant'] = $this->findSignaturePath($contractId, 'tenant');
        }

        $contract->loadMissing(['members', 'room.services', 'room.assets', 'property', 'org', 'createdBy']);

        [$vars, $serviceItems, $assetItems] = $this->composeDocumentVariables($contract, $extraData);

        // Backward-compatible signature placeholders for legacy templates.
        if (! empty($vars['signature_landlord'])) {
            $vars['landlord_signature'] = $vars['signature_landlord'];
            $vars['signature_manager'] = $vars['signature_landlord'];
            $vars['signature_ben_a'] = $vars['signature_landlord'];
        }
        if (! empty($vars['signature_tenant'])) {
            $vars['tenant_signature'] = $vars['signature_tenant'];
            $vars['signature_renter'] = $vars['signature_tenant'];
            $vars['signature_ben_b'] = $vars['signature_tenant'];
        }

        foreach ([
            'signature_landlord', 'signature_tenant', 'landlord_signature', 'tenant_signature',
            'signature_ben_a', 'signature_ben_b', 'signature_manager', 'signature_renter',
        ] as $sigKey) {
            if (! array_key_exists($sigKey, $vars) || $vars[$sigKey] === null) {
                $vars[$sigKey] = '';
            }
        }

        // Map roommates for simple template fields
        $roommates = ($contract->members ?? collect())->where('is_primary', false)->values();
        for ($i = 0; $i < 5; $i++) {
            $index = $i + 1;
            $member = $roommates->get($i);
            $vars["roommate_{$index}_name"] = $member?->full_name ?? '';
            $vars["roommate_{$index}_id"] = $member?->identity_number ?? '';
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

        $hasSignatures = ! empty($vars['signature_landlord']) || ! empty($vars['signature_tenant']);

        // Delegate rendering
        if (! empty($contract->custom_content)) {
            $vars['room_service_list'] = implode('<br/>', $serviceItems);
            $vars['room_asset_list'] = implode('<br/>', $assetItems);
            $vars['member_list'] = $this->getMemberListTable($contract, 'HTML');
            // Create a fake template to easily reuse the generateHtmlDocument code
            $fakeTemplate = new DocumentTemplate(['content' => $contract->custom_content, 'format' => 'HTML']);
            $storagePath = $this->generateHtmlDocument($contract, $fakeTemplate, $vars);
        } elseif ($template && $template->format === 'HTML') {
            $vars['room_service_list'] = implode('<br/>', $serviceItems);
            $vars['room_asset_list'] = implode('<br/>', $assetItems);
            $vars['member_list'] = $this->getMemberListTable($contract, 'HTML');
            $storagePath = $this->generateHtmlDocument($contract, $template, $vars);
        } elseif ($hasSignatures) {
            // Có ít nhất một chữ ký: luôn HTML→PDF để nhúng ảnh ký đúng (DomPDF + base64).
            // Template DOCX + PHPWord + docx-preview trên trình duyệt không hiển thị ảnh ký tin cậy.
            $vars['room_service_list'] = implode('<br/>', $serviceItems);
            $vars['room_asset_list'] = implode('<br/>', $assetItems);
            $vars['member_list'] = $this->getMemberListTable($contract, 'HTML');
            $fakeTemplate = new DocumentTemplate(['content' => $this->buildDefaultHtmlContent(), 'format' => 'HTML']);
            $storagePath = $this->generateHtmlDocument($contract, $fakeTemplate, $vars);
        } else {
            $vars['room_service_list'] = implode('<w:br/>', $serviceItems);
            $vars['room_asset_list'] = implode('<w:br/>', $assetItems);
            $vars['member_list'] = $this->getMemberListTable($contract, 'DOCX');
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

        if ($template && ! empty($template->file_path)) {
            $path = Storage::disk('local')->path($template->file_path);
            if (file_exists($path)) {
                $templatePath = $path;
            }
        }

        if (! $templatePath) {
            $templatePath = $this->resolveDefaultDocxPath();
            if (! file_exists($templatePath)) {
                $this->createDefaultDocxTemplate($templatePath);
            }
        }

        $templateProcessor = new TemplateProcessor($templatePath);

        foreach ($vars as $key => $value) {
            if (is_string($value) && str_contains($key, 'signature') && ! empty($value) && file_exists(Storage::disk('local')->path($value))) {
                $templateProcessor->setImageValue($key, [
                    'path' => Storage::disk('local')->path($value),
                    'width' => 120,
                    'height' => 60,
                    'ratio' => false,
                ]);
            } else {
                $templateProcessor->setValue($key, (string) $value);
            }
        }

        $filename = 'hop-dong-'.Str::slug($contract->id).'-'.now()->format('YmdHis').'.docx';
        $storagePath = 'contracts/documents/'.$filename;
        $fullPath = Storage::disk('local')->path($storagePath);

        if (! is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        $templateProcessor->saveAs($fullPath);

        return $storagePath;
    }

    private function generateHtmlDocument(Contract $contract, DocumentTemplate $template, array $vars): string
    {
        $rawContent = $template->content ?? '';
        $html = $rawContent;

        foreach ($vars as $key => $value) {
            if (is_string($value) && str_contains((string) $key, 'signature') && $value !== '' && ! file_exists(Storage::disk('local')->path($value))) {
                $value = '';
            }
            if (is_string($value) && str_contains((string) $key, 'signature') && $value !== '' && file_exists(Storage::disk('local')->path($value))) {
                $fullPath = Storage::disk('local')->path($value);
                $type = pathinfo($fullPath, PATHINFO_EXTENSION);
                $data = file_get_contents($fullPath);
                $base64 = 'data:image/'.$type.';base64,'.base64_encode($data);
                $imgTag = "<img src='{$base64}' width='120' height='60' alt='' class='sig-img' />";
                $html = str_replace('${'.$key.'}', $imgTag, $html);
            } else {
                $html = str_replace('${'.$key.'}', (string) $value, $html);
            }
        }

        if ($this->signatureFilesPresentInVars($vars) && ! $this->htmlTemplateDeclaresSignaturePlaceholders($rawContent)) {
            $html = $this->stripLegacySignatureTableHtml($html);
            $html .= $this->buildAppendedSignaturesHtml($vars);
        }

        $html = $this->wrapHtmlForDomPdf($html);

        $pdf = Pdf::loadHTML($html, 'UTF-8')->setPaper('a4');

        $filename = 'hop-dong-'.Str::slug($contract->id).'-'.now()->format('YmdHis').'.pdf';
        $storagePath = 'contracts/documents/'.$filename;
        $fullPath = Storage::disk('local')->path($storagePath);

        if (! is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        $pdf->save($fullPath);

        return $storagePath;
    }

    /**
     * Có ít nhất một file ảnh chữ ký hợp lệ trong biến mẫu.
     */
    private function signatureFilesPresentInVars(array $vars): bool
    {
        foreach ($vars as $key => $value) {
            if (! is_string($value) || $value === '' || ! str_contains((string) $key, 'signature')) {
                continue;
            }
            if (file_exists(Storage::disk('local')->path($value))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Mẫu HTML đã khai báo placeholder ảnh ký (không cần append thêm).
     */
    private function htmlTemplateDeclaresSignaturePlaceholders(string $content): bool
    {
        return str_contains($content, '${signature_landlord}')
            || str_contains($content, '${signature_tenant}')
            || str_contains($content, '${landlord_signature}')
            || str_contains($content, '${tenant_signature}')
            || str_contains($content, '${signature_ben_a}')
            || str_contains($content, '${signature_ben_b}')
            || str_contains($content, '${signature_manager}')
            || str_contains($content, '${signature_renter}');
    }

    /**
     * Bổ sung khối chữ ký khi mẫu org chỉ in tên mà không có ${signature_*}.
     * Dùng DejaVu Sans + tiêu đề trùng mẫu hợp đồng (một cột / một bên).
     */
    private function buildAppendedSignaturesHtml(array $vars): string
    {
        $landlordImg = $this->signatureVarToImgTag($vars, 'signature_landlord')
            ?? $this->signatureVarToImgTag($vars, 'landlord_signature')
            ?? $this->signatureVarToImgTag($vars, 'signature_ben_a')
            ?? $this->signatureVarToImgTag($vars, 'signature_manager')
            ?? '';
        $tenantImg = $this->signatureVarToImgTag($vars, 'signature_tenant')
            ?? $this->signatureVarToImgTag($vars, 'tenant_signature')
            ?? $this->signatureVarToImgTag($vars, 'signature_ben_b')
            ?? $this->signatureVarToImgTag($vars, 'signature_renter')
            ?? '';

        $repName = htmlspecialchars((string) ($vars['rep_full_name'] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $tenantName = htmlspecialchars((string) ($vars['tenant_full_name'] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $dateLine = htmlspecialchars(
            (string) ($vars['contract_created_at_vn'] ?? $vars['created_at'] ?? ''),
            ENT_QUOTES | ENT_HTML5,
            'UTF-8'
        );

        return <<<HTML
<div style="margin-top: 24px; page-break-inside: avoid; font-family: DejaVu Sans, sans-serif; font-size: 12pt; line-height: 1.5; color: #111;">
  <p style="text-align: center; margin-bottom: 16px;"><strong>{$dateLine}</strong></p>
  <table style="width: 100%; border-collapse: collapse; text-align: center;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding: 12px;">
        <div style="font-weight: bold; margin-bottom: 8px;">BÊN CHO THUÊ (BÊN A)</div>
        <div style="min-height: 64px;">{$landlordImg}</div>
        <div style="margin-top: 8px;">{$repName}</div>
      </td>
      <td style="width: 50%; vertical-align: top; padding: 12px;">
        <div style="font-weight: bold; margin-bottom: 8px;">BÊN THUÊ (BÊN B)</div>
        <div style="min-height: 64px;">{$tenantImg}</div>
        <div style="margin-top: 8px;">{$tenantName}</div>
      </td>
    </tr>
  </table>
</div>
HTML;
    }

    /**
     * Gỡ bảng ký kiểu seeder cũ (chỉ tên, không ảnh) để tránh trùng với khối chữ ký bổ sung.
     */
    private function stripLegacySignatureTableHtml(string $html): string
    {
        $pattern = '/<div\s+style="margin-top:\s*50px[^"]*">\s*<table[^>]*>[\s\S]*?BÊN CHO THUÊ[\s\S]*?<\/table>\s*(?:<p[^>]*>[\s\S]*?<\/p>\s*)?<\/div>/iu';

        return preg_replace($pattern, '', $html, 1) ?? $html;
    }

    /**
     * Logo góc trái (PNG public) — DomPDF ổn định với data URI.
     */
    private function hostechDomPdfLogoHtml(): string
    {
        $path = public_path('images/hostech-logo.png');
        if (! is_readable($path)) {
            return '';
        }
        $uri = 'data:image/png;base64,'.base64_encode((string) file_get_contents($path));

        return '<div style="margin:0 0 10px 0;display:inline-block;background:#fff;padding:5px 6px;border-radius:10px;border:1px solid #e5e7eb;"><img src=\''.$uri.'\' width="56" height="56" alt="" style="display:block;"/></div>';
    }

    private function injectHostechLogoAfterBodyOpen(string $html): string
    {
        $logo = $this->hostechDomPdfLogoHtml();
        if ($logo === '') {
            return $html;
        }
        $replaced = preg_replace('/<body([^>]*)>/i', '<body$1>'.$logo, $html, 1);

        return $replaced ?? $html;
    }

    /**
     * DomPDF cần HTML đầy đủ + charset + font hỗ trợ tiếng Việt cho mọi fragment (kể cả phần append).
     */
    private function wrapHtmlForDomPdf(string $html): string
    {
        if (preg_match('/<\s*html[\s>]/i', $html)) {
            if (! preg_match('/charset\s*=\s*["\']utf-8/i', $html)) {
                $html = preg_replace('/<head([^>]*)>/i', '<head$1><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>', $html, 1) ?? $html;
            }

            return $this->injectHostechLogoAfterBodyOpen($html);
        }

        $logo = $this->hostechDomPdfLogoHtml();

        return '<!DOCTYPE html><html lang="vi"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/></head><body style="font-family: DejaVu Sans, sans-serif; font-size: 12pt; line-height: 1.5; color: #111;">'.$logo.$html.'</body></html>';
    }

    private function signatureVarToImgTag(array $vars, string $key): ?string
    {
        $path = $vars[$key] ?? null;
        if (! is_string($path) || $path === '' || ! file_exists(Storage::disk('local')->path($path))) {
            return null;
        }

        $fullPath = Storage::disk('local')->path($path);
        $type = pathinfo($fullPath, PATHINFO_EXTENSION);
        $data = file_get_contents($fullPath);
        $base64 = 'data:image/'.$type.';base64,'.base64_encode($data);

        return "<img src='{$base64}' width='120' height='60' alt='' style='display:inline-block;' />";
    }

    private function formatBankInfo(?Property $property): string
    {
        if (! $property || empty($property->bank_accounts)) {
            return '---';
        }

        return $this->renderBankAccounts($property->bank_accounts);
    }

    private function formatOrgBankInfo(?Org $org): string
    {
        if (! $org || empty($org->bank_accounts)) {
            return '---';
        }

        return $this->renderBankAccounts($org->bank_accounts);
    }

    /**
     * Render bank accounts for PDF/DOCX contract.
     * Handles array or JSON string, and supports legacy keys.
     */
    private function renderBankAccounts($accounts): string
    {
        // Handle JSON string input
        if (is_string($accounts)) {
            $decoded = json_decode($accounts, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $accounts = $decoded;
            } else {
                // If not valid JSON, maybe it is just a string description
                return $accounts ?: '---';
            }
        }

        if (! is_array($accounts)) {
            return '---';
        }

        $lines = [];
        foreach ($accounts as $acc) {
            // Standard keys: bank_name, account_number, account_name
            // Legacy/Alternative keys: bank, account
            $bankName = $acc['bank_name'] ?? $acc['bank'] ?? 'Ngân hàng';
            $accNum = $acc['account_number'] ?? $acc['account'] ?? '';
            $accName = $acc['account_name'] ?? '';

            if ($accNum) {
                $lines[] = "{$bankName}: {$accNum}";
                if ($accName) {
                    $lines[] = "Chủ TK: {$accName}";
                }
            }
        }

        return count($lines) > 0 ? implode("\n", $lines) : '---';
    }

    private function getMemberListTable(Contract $contract, string $format = 'HTML'): string
    {
        $members = $contract->members;
        if (! $members || $members->isEmpty()) {
            return '---';
        }

        if ($format === 'DOCX') {
            $lines = [];
            foreach ($members as $index => $m) {
                $dob = $m->date_of_birth ? Carbon::parse($m->date_of_birth)->format('d/m/Y') : '---';
                $id = $m->identity_number ?? '---';
                $phone = $m->phone ?? '---';
                $plate = $m->license_plate ?? '---';

                $text = ($index + 1).'. '.$m->full_name.' - Ngày sinh: '.$dob.' - CCCD: '.$id.' - SĐT: '.$phone;
                if (! empty($plate) && $plate !== '---') {
                    $text .= ' - Biển số xe: '.$plate;
                }
                $lines[] = $text;
            }

            return implode($format === 'DOCX' ? "\n" : '<br/>', $lines);
        }

        // HTML Table for PDF
        $html = '<table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11pt;">';
        $html .= '<thead>';
        $html .= '<tr style="background-color: #f2f2f2;">';
        $html .= '<th style="border: 1px solid #000; padding: 6px; text-align: center; width: 40px;">STT</th>';
        $html .= '<th style="border: 1px solid #000; padding: 6px; text-align: left;">Họ và tên</th>';
        $html .= '<th style="border: 1px solid #000; padding: 6px; text-align: center; width: 100px;">Ngày sinh</th>';
        $html .= '<th style="border: 1px solid #000; padding: 6px; text-align: left; width: 120px;">Số căn cước</th>';
        $html .= '<th style="border: 1px solid #000; padding: 6px; text-align: left; width: 100px;">SĐT</th>';
        $html .= '<th style="border: 1px solid #000; padding: 6px; text-align: left;">Biển số xe</th>';
        $html .= '</tr>';
        $html .= '</thead>';
        $html .= '<tbody>';

        foreach ($members as $index => $m) {
            $dob = $m->date_of_birth ? Carbon::parse($m->date_of_birth)->format('d/m/Y') : '---';
            $id = $m->identity_number ?? '---';
            $phone = $m->phone ?? '---';
            $plate = $m->license_plate ?? '---';

            $html .= '<tr>';
            $html .= '<td style="border: 1px solid #000; padding: 6px; text-align: center;">'.($index + 1).'</td>';
            $html .= '<td style="border: 1px solid #000; padding: 6px;">'.e($m->full_name).'</td>';
            $html .= '<td style="border: 1px solid #000; padding: 6px; text-align: center;">'.$dob.'</td>';
            $html .= '<td style="border: 1px solid #000; padding: 6px;">'.$id.'</td>';
            $html .= '<td style="border: 1px solid #000; padding: 6px;">'.$phone.'</td>';
            $html .= '<td style="border: 1px solid #000; padding: 6px;">'.$plate.'</td>';
            $html .= '</tr>';
        }

        $html .= '</tbody>';
        $html .= '</table>';

        return $html;
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
            Log::warning('Error finding signature path: '.$e->getMessage());
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
        if (! $filePath) {
            return [];
        }

        $fullPath = Storage::disk('local')->path($filePath);
        if (! file_exists($fullPath)) {
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

    /**
     * Returns a complete HTML contract layout with ${variable} placeholders.
     * Used as a reliable fallback when no custom template exists and signatures
     * are present, since PHPWord TemplateProcessor::setImageValue + docx-preview
     * do not render embedded images consistently in the browser.
     */
    private function buildDefaultHtmlContent(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 20mm 18mm; }
  body { font-family: "DejaVu Sans", Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #111; }
  h2 { text-align: center; font-size: 15pt; text-transform: uppercase; margin-bottom: 4px; }
  .subtitle { text-align: center; font-size: 11pt; margin-top: 0; margin-bottom: 24px; }
  .section-title { font-weight: bold; font-size: 13pt; margin-top: 18px; margin-bottom: 6px; }
  .party-block { margin-bottom: 10px; }
  .party-block p { margin: 2px 0; }
  table.sig-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
  table.sig-table td { width: 50%; text-align: center; padding: 8px 16px; vertical-align: top; }
  .sig-label { font-weight: bold; font-size: 12pt; margin-bottom: 4px; }
  .sig-img { margin: 8px auto; display: block; }
  .sig-name { margin-top: 4px; font-size: 11pt; }
  hr { border: none; border-top: 1px solid #888; margin: 8px 0; }
  p { margin: 3px 0; }
</style>
</head>
<body>
<h2>Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam</h2>
<p class="subtitle">Độc lập – Tự do – Hạnh phúc</p>

<h2>Hợp Đồng Thuê Phòng</h2>
<p class="subtitle">Mã hợp đồng: ${contract_id}</p>

<p><strong>${contract_created_at_vn}</strong>, hai bên gồm:</p>

<div class="party-block">
  <p class="section-title">BÊN CHO THUÊ (BÊN A):</p>
  <p>Cơ quan/Tổ chức: <strong>${org_name}</strong></p>
  <p>Đại diện bởi: <strong>${rep_full_name}</strong> &nbsp;&nbsp; Chức vụ: ${rep_role}</p>
  <p>CCCD số: ${rep_identity_number} &nbsp;&nbsp; Cấp ngày: ${rep_identity_issued}</p>
  <p>Địa chỉ thường trú: ${rep_address}</p>
  <p>Điện thoại: ${rep_phone}</p>
</div>

<div class="party-block">
  <p class="section-title">BÊN THUÊ NHÀ (BÊN B):</p>
  <p>Họ và tên: <strong>${tenant_full_name}</strong> &nbsp;&nbsp; Năm sinh: ${tenant_dob}</p>
  <p>CCCD số: ${tenant_identity_number} &nbsp;&nbsp; Điện thoại: ${tenant_phone}</p>
  <p>Địa chỉ HKTT: ${tenant_address}</p>
</div>

<p><em>Sau khi hai bên đi đến thống nhất ký kết hợp đồng thuê nhà với các điều kiện và điều khoản sau đây:</em></p>

<p class="section-title">ĐIỀU 1: NỘI DUNG HỢP ĐỒNG</p>
<p>1.1. Bên A đồng ý cho bên B được thuê căn phòng số: <strong>${room_code}</strong>, tổng diện tích: ${room_area}m² thuộc tòa nhà ${property_name}.</p>
<p>1.2. Mục đích thuê: Dùng để ở. Sức chứa tối đa: ${room_capacity} người.</p>
<p>1.3. Thời hạn thuê: Từ ngày <strong>${contract_start_date}</strong> đến ngày <strong>${contract_end_date}</strong>.</p>
<p>1.4. Tài sản trong nhà bàn giao:</p>
<p>${room_asset_list}</p>

<p class="section-title">ĐIỀU 2: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</p>
<p>2.1. Giá thuê nhà mỗi tháng là: <strong>${contract_rent_price} VNĐ/tháng</strong> (phí dịch vụ cố định gắn phòng: ${contract_fixed_services_fee} VNĐ/tháng; tổng: ${contract_total_rent} VNĐ/tháng).</p>
<p>2.2. Tiền đặt cọc: <strong>${contract_deposit_amount} VNĐ</strong> (tương đương ${contract_deposit_months} tháng tổng tiền thuê theo hợp đồng, gồm tiền phòng và phí dịch vụ cố định).</p>
<p>2.3. Chi phí dịch vụ khác:</p>
<p>${room_service_list}</p>
<p>2.4. Chu kỳ thanh toán tiền phòng: <strong>${contract_billing_cycle}</strong>.</p>
<p>2.5. Thời hạn thanh toán: ${payment_range}.</p>
<p>2.6. Thông tin tài khoản nhận tiền:</p>
<p>${property_bank_info}</p>

<p class="section-title">ĐIỀU 3: TRÁCH NHIỆM VÀ QUY ĐỊNH CHUNG</p>
<p>3.1. Các quy định về hành vi và vệ sinh:</p>
<p>${property_house_rules}</p>
<p>3.2. Bên thuê có trách nhiệm bảo quản tốt các tài sản, trang thiết bị trong nhà. Nếu hư hỏng do lỗi người dùng phải bồi thường theo giá thị trường.</p>
<p>3.3. Tuyệt đối không được khoan tường, đóng đinh, dán giấy khi chưa được sự đồng ý của Bên A.</p>

<p class="section-title">ĐIỀU 4: CHẤM DỨT HỢP ĐỒNG</p>
<p>4.1. Trong trường hợp một trong hai bên muốn chấm dứt hợp đồng trước hạn phải thông báo cho bên kia ít nhất 30 ngày.</p>
<p>4.2. Nếu Bên B tự ý chấm dứt hợp đồng mà không báo trước hoặc vi phạm nghiêm trọng các quy định tại Điều 3, Bên A có quyền đơn phương chấm dứt và không hoàn trả tiền đặt cọc.</p>

<p style="margin-top:16px;">Hợp đồng này được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị pháp lý như nhau.</p>

<p style="text-align:center;margin-top:20px;font-size:12pt;"><strong>${contract_created_at_vn}</strong></p>

<table class="sig-table">
  <tr>
    <td>
      <p class="sig-label">BÊN CHO THUÊ (BÊN A)</p>
      ${signature_landlord}
      <p class="sig-name">${rep_full_name}</p>
    </td>
    <td>
      <p class="sig-label">BÊN THUÊ (BÊN B)</p>
      ${signature_tenant}
      <p class="sig-name">${tenant_full_name}</p>
    </td>
  </tr>
</table>
</body>
</html>
HTML;
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
        if (! class_exists(PhpWord::class)) {
            throw new \RuntimeException(
                'Package phpoffice/phpword chưa được cài. Chạy: composer require phpoffice/phpword'
            );
        }

        $dir = dirname($outputPath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $phpWord = new PhpWord;
        $phpWord->setDefaultFontName('Times New Roman');
        $phpWord->setDefaultFontSize(13);

        $section = $phpWord->addSection();

        $section->addText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', ['bold' => true, 'size' => 13], ['alignment' => Jc::CENTER]);
        $section->addText('Độc lập – Tự do – Hạnh phúc', ['bold' => true, 'size' => 13, 'underline' => 'single'], ['alignment' => Jc::CENTER]);
        $section->addText('-----o0o-----', [], ['alignment' => Jc::CENTER]);
        $section->addText('', [], []);

        $section->addText('HỢP ĐỒNG THUÊ NHÀ', ['bold' => true, 'size' => 16], ['alignment' => Jc::CENTER]);
        $section->addText('', [], []);

        $section->addText('Hôm nay, ngày '.date('d').' tháng '.date('m').' năm '.date('Y').' tại tòa nhà ${property_name}');
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
        $section->addText('1.4. Tài sản trong nhà bàn giao:');
        $section->addText('${room_asset_list}');
        $section->addText('');

        $section->addText('ĐIỀU 2: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN', ['bold' => true]);
        $section->addText('2.1. Giá thuê nhà mỗi tháng là: ${contract_rent_price} VNĐ/tháng (phí dịch vụ cố định: ${contract_fixed_services_fee} VNĐ/tháng; tổng: ${contract_total_rent} VNĐ/tháng).');
        $section->addText('2.2. Tiền đặt cọc: ${contract_deposit_amount} VNĐ (tương đương ${contract_deposit_months} tháng tổng tiền thuê theo hợp đồng, gồm tiền phòng và phí dịch vụ cố định).');
        $section->addText('2.3. Chi phí dịch vụ khác:');
        $section->addText('${room_service_list}');
        $section->addText('2.4. Chu kỳ thanh toán tiền phòng: ${contract_billing_cycle}.');
        $section->addText('2.5. Thời hạn thanh toán: ${payment_range}.');
        $section->addText('2.6. Thông tin tài khoản nhận tiền:');
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
        $table->addCell(5000)->addText('BÊN CHO THUÊ (BÊN A)', ['bold' => true], ['alignment' => Jc::CENTER]);
        $table->addCell(5000)->addText('BÊN THUÊ (BÊN B)', ['bold' => true], ['alignment' => Jc::CENTER]);
        $table->addRow();
        $table->addCell(5000)->addText('${signature_landlord}', ['bold' => true], ['alignment' => Jc::CENTER]);
        $table->addCell(5000)->addText('${signature_tenant}', ['bold' => true], ['alignment' => Jc::CENTER]);

        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($outputPath);
    }
}
