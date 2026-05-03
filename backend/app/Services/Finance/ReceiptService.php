<?php

namespace App\Services\Finance;

use App\Enums\DepositStatus;
use App\Events\Finance\ReceiptGenerated;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\Payment;
use App\Models\Finance\Receipt;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReceiptService
{
    /**
     * Disk to store receipts.
     */
    protected string $disk = 'public';

    /**
     * Directory within the disk.
     */
    protected string $directory = 'receipts';

    /**
     * Generate a PDF receipt for a given payment.
     *
     * @throws \Exception
     */
    public function generateForPayment(Payment $payment): Receipt
    {
        // 1. Prepare data for the template
        $data = [
            'payment' => $payment->load([
                'property',
                'allocations.invoice',
                'payer',
                'receivedBy',
                'approvedBy',
            ]),
            'generated_at' => now(),
            'reference' => 'RCP-'.strtoupper(Str::random(8)),
        ];

        // 2. Render PDF using dompdf
        $pdf = Pdf::loadView('pdf.receipt', $data)
            ->setPaper('a4')
            ->setWarnings(false);

        $content = $pdf->output();

        // 3. Save file to storage
        $filename = 'receipt_'.$payment->id.'_'.time().'.pdf';
        $path = $this->directory.'/'.$filename;

        Storage::disk($this->disk)->put($path, $content);

        // 4. Official PDF receipt (do not overwrite tenant PROOF upload row)
        $receipt = Receipt::updateOrCreate(
            [
                'payment_id' => $payment->id,
                'kind' => Receipt::KIND_OFFICIAL,
            ],
            [
                'org_id' => $payment->org_id,
                'path' => $path,
                'sha256' => hash('sha256', $content),
            ]
        );

        // 5. Dispatch Event for downstream automation
        ReceiptGenerated::dispatch($receipt);

        return $receipt;
    }

    /**
     * Get the absolute URL for a receipt file.
     */
    public function getUrl(Receipt $receipt): string
    {
        return Storage::disk($this->disk)->url($receipt->path);
    }

    /**
     * Render bản mềm (PDF) cho phiếu hoàn cọc và lưu vào disk public.
     *
     * Idempotent: gọi nhiều lần vẫn cập nhật path/sha mới nhất nhưng giữ nguyên `reference` ban đầu.
     */
    public function generateForRefundReceipt(RefundReceipt $refund): RefundReceipt
    {
        $refund->loadMissing([
            'contract.property',
            'contract.room',
            'paidBy',
        ]);

        $contract = $refund->contract;
        if ($contract === null) {
            throw new \RuntimeException('Phiếu hoàn cọc không có hợp đồng — không thể sinh PDF.');
        }

        $reference = $refund->reference ?: 'RFD-'.strtoupper(Str::random(8));

        $primaryMember = $contract->members()
            ->where('is_primary', true)
            ->with('user')
            ->first();

        $tenantUser = $primaryMember?->user;
        $tenantName = $tenantUser->full_name
            ?? $tenantUser->name
            ?? $primaryMember?->full_name
            ?? 'Khách thuê';
        $tenantEmail = $tenantUser->email ?? $primaryMember?->email ?? null;
        $tenantPhone = $tenantUser->phone ?? $primaryMember?->phone ?? null;

        $meta = $refund->meta ?? [];
        $depositPortion = isset($meta['deposit_refund_portion']) ? (float) $meta['deposit_refund_portion'] : null;
        $goodwillPortion = isset($meta['goodwill_refund_portion']) ? (float) $meta['goodwill_refund_portion'] : null;
        if ($depositPortion !== null || $goodwillPortion !== null) {
            $offset = max(0.0, round((float) $contract->deposit_amount - (float) ($depositPortion ?? 0), 2));
        } else {
            $offset = max(0, round((float) $contract->deposit_amount - (float) $refund->amount, 2));
        }

        $depositStatus = $contract->deposit_status;
        $depositLabel = $depositStatus instanceof DepositStatus
            ? $depositStatus->label()
            : (string) ($depositStatus ?? '—');

        $data = [
            'refund' => $refund,
            'contract' => $contract,
            'reference' => $reference,
            'generated_at' => now(),
            'paid_at' => $refund->paid_at,
            'tenant_name' => $tenantName,
            'tenant_email' => $tenantEmail,
            'tenant_phone' => $tenantPhone,
            'offset_amount' => $offset,
            'deposit_status_label' => $depositLabel,
            'deposit_refund_portion' => $depositPortion,
            'goodwill_refund_portion' => $goodwillPortion,
        ];

        $pdf = Pdf::loadView('pdf.refund_receipt', $data)
            ->setPaper('a4')
            ->setWarnings(false);

        $content = $pdf->output();

        $filename = 'refund_'.$refund->id.'_'.time().'.pdf';
        $path = $this->directory.'/'.$filename;

        Storage::disk($this->disk)->put($path, $content);

        $refund->forceFill([
            'reference' => $reference,
            'pdf_path' => $path,
            'pdf_sha256' => hash('sha256', $content),
        ])->save();

        return $refund->refresh();
    }

    /**
     * URL public của bản mềm phiếu hoàn cọc (null nếu chưa sinh).
     */
    public function getRefundPdfUrl(RefundReceipt $refund): ?string
    {
        if (! $refund->pdf_path) {
            return null;
        }

        return Storage::disk($this->disk)->url($refund->pdf_path);
    }
}
