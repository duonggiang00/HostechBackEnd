<?php

namespace App\Listeners\Billing;

use App\Events\Contract\ContractActivated;
use App\Services\Service\ServiceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Snapshots the current Room service configuration (prices, tiers) into
 * the Contract's `meta` field at the moment the contract becomes ACTIVE.
 *
 * This achieves a "Service Lock" — ensuring that future price changes to a
 * service will NOT retroactively affect existing active contracts.
 *
 * Stored structure in contract.meta['locked_services']:
 * [
 *   {
 *     "service_id"   : "uuid",
 *     "name"         : "Điện",
 *     "type"         : "ELECTRIC",
 *     "calc_mode"    : "PER_METER",
 *     "current_price": 3500,
 *     "tiered_rates" : [ { "tier_from": 0, "tier_to": 50, "price": 1678 }, ... ]
 *   },
 *   ...
 * ]
 */
class SnapshotContractServices implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        protected ServiceService $serviceService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(ContractActivated $event): void
    {
        $contract = $event->contract;

        Log::info('[Billing] Snapshotting services for activated contract', [
            'contract_id' => $contract->id,
            'room_id'     => $contract->room_id,
        ]);

        try {
            // Fetch all services currently linked to the room
            $roomServices = $this->serviceService->getRoomServices(
                $contract->room_id,
                $contract->org_id
            );

            $lockedServices = [];

            foreach ($roomServices as $rs) {
                $service     = $rs->service;
                $currentRate = $service->currentRate;

                if (! $currentRate) {
                    continue;
                }

                // Eager-load tiered rates for snapshot
                $currentRate->loadMissing('tieredRates');

                $serviceSnapshot = [
                    'service_id'    => $service->id,
                    'name'          => $service->name,
                    'type'          => $service->type,
                    'calc_mode'     => $service->calc_mode,
                    'current_price' => (float) $currentRate->price,
                    'tiered_rates'  => [],
                ];

                // Include tiered rate breakdown if applicable
                foreach ($currentRate->tieredRates as $tier) {
                    $serviceSnapshot['tiered_rates'][] = [
                        'tier_from' => $tier->tier_from,
                        'tier_to'   => $tier->tier_to,
                        'price'     => (float) $tier->price,
                    ];
                }

                $lockedServices[] = $serviceSnapshot;
            }

            // Merge into existing meta without destroying other keys
            $meta = $contract->meta ?? [];
            $meta['locked_services']    = $lockedServices;
            $meta['services_locked_at'] = now()->toIso8601String();

            $contract->update(['meta' => $meta]);

            Log::info('[Billing] Service snapshot saved', [
                'contract_id'     => $contract->id,
                'services_count'  => count($lockedServices),
            ]);
        } catch (\Exception $e) {
            Log::error('[Billing] Failed to snapshot contract services', [
                'contract_id' => $contract->id,
                'error'       => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
