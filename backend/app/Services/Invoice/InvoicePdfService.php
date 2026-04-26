<?php

namespace App\Services\Invoice;

use App\Models\Invoice\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InvoicePdfService
{
    /**
     * Disk to store invoices.
     */
    protected string $disk = 'public';

    /**
     * Directory within the disk.
     */
    protected string $directory = 'invoices';

    /**
     * Generate a PDF for a given invoice.
     * 
     * @param Invoice $invoice
     * @return string The path to the stored PDF
     * @throws \Exception
     */
    public function generate(Invoice $invoice): string
    {
        // 1. Prepare data for the template
        $data = [
            'invoice' => $invoice->load(['property', 'room', 'contract.members.user', 'items', 'org']),
            'generated_at' => now(),
        ];

        // 2. Render PDF using dompdf
        $pdf = Pdf::loadView('pdf.invoice', $data)
            ->setPaper('a4')
            ->setWarnings(false);

        $content = $pdf->output();

        // 3. Save file to storage
        $filename = 'invoice_' . $invoice->id . '_' . time() . '.pdf';
        $path = $this->directory . '/' . $filename;

        // Ensure directory exists
        if (!Storage::disk($this->disk)->exists($this->directory)) {
            Storage::disk($this->disk)->makeDirectory($this->directory);
        }

        Storage::disk($this->disk)->put($path, $content);

        // 4. Update Invoice record
        $invoice->update(['pdf_path' => $path]);

        return $path;
    }

    /**
     * Get the absolute URL for an invoice PDF.
     */
    public function getUrl(Invoice $invoice): ?string
    {
        return $invoice->pdf_path ? Storage::disk($this->disk)->url($invoice->pdf_path) : null;
    }
}
