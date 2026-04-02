<?php

namespace App\Features\Meter\Services;

use App\Features\Meter\Models\AdjustmentNote;
use App\Features\Meter\Models\MeterReading;
use App\Features\Org\Models\User;
use App\Features\System\Models\TemporaryUpload;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class AdjustmentNoteService
{
    protected $meterReadingService;

    public function __construct(MeterReadingService $meterReadingService)
    {
        $this->meterReadingService = $meterReadingService;
    }

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
                'requested_by_user_id' => auth()->id() ?? User::where('org_id', $reading->org_id)->first()?->id, // Fallback logic
                'status' => 'PENDING',
            ]);

            // Clean up and attach media
            if (! empty($data['proof_media_ids'])) {
                $temporaryUploads = TemporaryUpload::whereIn('id', $data['proof_media_ids'])->get();

                foreach ($temporaryUploads as $tempUpload) {
                    $mediaItem = $tempUpload->getFirstMedia();

                    if ($mediaItem && file_exists($mediaItem->getPath())) {
                        $note->addMedia($mediaItem->getPath())
                            ->preservingOriginal()
                            ->toMediaCollection('adjustment_proofs');
                    }
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

            // Hook 2: Overwrite original reading value using service to trigger recalculation & cascade
            $reading = $note->meterReading;
            $this->meterReadingService->update($reading, [
                'reading_value' => $note->after_value,
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
     */
    protected function triggerInvoiceUpdateHooks(MeterReading $reading, int $oldValue, int $newValue)
    {
        $difference = $newValue - $oldValue;

        if ($difference === 0) {
            return;
        }

        // Implementation note: Cross-feature calls should ideally go through an event or a dedicated bridge service
        // For now, we keep it as a placeholder or use the Invoice feature service if available
    }
}
