<?php

namespace App\Services\Meter;

use App\Models\Meter\AdjustmentNote;
use App\Models\Meter\MeterReading;
use App\Models\System\TemporaryUpload;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class AdjustmentNoteService
{
    /**
     * Get adjustment notes for a specific meter reading.
     */
    public function indexForReading(string $meterReadingId)
    {
        return QueryBuilder::for(AdjustmentNote::class)
            ->where('meter_reading_id', $meterReadingId)
            ->allowedSorts(['created_at', 'status'])
            ->defaultSort('-created_at')
            ->allowedIncludes(['requestedBy', 'approvedBy', 'rejectedBy'])
            ->with('media')
            ->get();
    }

    /**
     * Create a new adjustment note and attach proof images.
     */
    public function create(MeterReading $reading, array $data): AdjustmentNote
    {
        return DB::transaction(function () use ($reading, $data) {
            $note = AdjustmentNote::create([
                'org_id' => $reading->org_id,
                'meter_reading_id' => $reading->id,
                'reason' => $data['reason'],
                'before_value' => $reading->reading_value,
                'after_value' => $data['after_value'],
                'requested_by_user_id' => auth()->id() ?? User::first()->id, // Fallback for testing if no auth
                'status' => 'PENDING',
            ]);

            // Clean up and attach media
            if (!empty($data['proof_media_ids'])) {
                $temporaryUploads = TemporaryUpload::whereIn('id', $data['proof_media_ids'])->get();

                foreach ($temporaryUploads as $tempUpload) {
                    $mediaItem = $tempUpload->getFirstMedia();
                    
                    if ($mediaItem && file_exists($mediaItem->getPath())) {
                        $note->addMedia($mediaItem->getPath())
                            ->preservingOriginal()
                            ->toMediaCollection('adjustment_proofs');
                    }
                    
                    // Optional: delete temporary upload record if you want to clean up immediately
                    // $tempUpload->delete();
                }
            }

            return $note;
        });
    }

    /**
     * Approve an adjustment note.
     */
    public function approve(AdjustmentNote $note): AdjustmentNote
    {
        if ($note->status !== 'PENDING') {
            abort(400, 'Only pending adjustment notes can be approved.');
        }

        return DB::transaction(function () use ($note) {
            // Hook 1: Set approval meta
            $note->update([
                'status' => 'APPROVED',
                'approved_by_user_id' => auth()->id(),
                'approved_at' => now(),
            ]);

            // Hook 2: Overwrite original reading value
            $reading = $note->meterReading;
            $reading->update([
                'reading_value' => $note->after_value
            ]);

            $this->triggerInvoiceUpdateHooks($reading, $note->before_value, $note->after_value);

            return $note;
        });
    }
    
    /**
     * Reject an adjustment note.
     */
    public function reject(AdjustmentNote $note, string $reason): AdjustmentNote
    {
        if ($note->status !== 'PENDING') {
            abort(400, 'Only pending adjustment notes can be rejected.');
        }

        $note->update([
            'status' => 'REJECTED',
            'reject_reason' => $reason,
            'rejected_by_user_id' => auth()->id(),
            'rejected_at' => now(),
        ]);

        return $note;
    }

    /**
     * Hook 3 (Financial sync): Trigger updates to draft invoices if there's a difference.
     * Note: This is a placeholder for where the actual invoice service would be called.
     */
    protected function triggerInvoiceUpdateHooks(MeterReading $reading, int $oldValue, int $newValue)
    {
        $difference = $newValue - $oldValue;
        
        if ($difference === 0) {
            return;
        }
        
        // TODO: Implement the actual invoice update logic here
        // Example:
        // InvoiceService::recalculateDraftInvoicesForMeter($reading->meter_id);
    }
}
