<?php

namespace App\Events\Meter;

use App\Enums\ContractStatus;
use App\Models\Org\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when multiple MeterReadings are approved in a single bulk operation.
 */
class BulkMeterReadingsApproved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<string>  $readingIds
     */
    public function __construct(
        public readonly array $readingIds,
        public readonly ?string $propertyId = null
    ) {}

    public function broadcastOn(): array
    {
        $channels = [];
        if ($this->propertyId) {
            $channels[] = new PrivateChannel('property.'.$this->propertyId);
        }

        // Add tenant channels for affected users to trigger real-time UI refresh
        if (! empty($this->readingIds)) {
            $tenantIds = User::whereHas('contractMembers', function ($q) {
                $q->where('status', 'APPROVED')
                    ->whereHas('contract', function ($cq) {
                        $cq->whereIn('status', [ContractStatus::ACTIVE, ContractStatus::PENDING_TERMINATION])
                            ->whereHas('room.meters.readings', function ($rq) {
                                $rq->whereIn('id', $this->readingIds);
                            });
                    });
            })->pluck('id');

            foreach ($tenantIds->unique() as $userId) {
                $channels[] = new PrivateChannel('App.Models.User.'.$userId);
            }
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'meter-readings.bulk_approved';
    }

    public function broadcastWith(): array
    {
        return [
            'reading_ids' => $this->readingIds,
            'count' => count($this->readingIds),
        ];
    }
}
