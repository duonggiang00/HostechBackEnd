<?php

namespace App\Services\Finance;

use App\Events\Finance\ReceiptGenerated;
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
     * @param Payment $payment
     * @return Receipt
     * @throws \Exception
     */
    public function generateForPayment(Payment $payment): Receipt
    {
        // 1. Prepare data for the template
        $data = [
            'payment' => $payment->load(['property', 'allocations.invoice', 'payer', 'receivedBy']),
            'generated_at' => now(),
            'reference' => 'RCP-' . strtoupper(Str::random(8)),
        ];

        // 2. Render PDF using dompdf
        $pdf = Pdf::loadView('pdf.receipt', $data)
            ->setPaper('a4')
            ->setWarnings(false);

        $content = $pdf->output();

        // 3. Save file to storage
        $filename = 'receipt_' . $payment->id . '_' . time() . '.pdf';
        $path = $this->directory . '/' . $filename;

        Storage::disk($this->disk)->put($path, $content);

        // 4. Create Receipt record (Idempotent check)
        $receipt = Receipt::updateOrCreate(
            ['payment_id' => $payment->id],
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
}
