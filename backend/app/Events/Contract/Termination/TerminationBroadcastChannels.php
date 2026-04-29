<?php

namespace App\Events\Contract\Termination;

use App\Models\Contract\Contract;
use Illuminate\Broadcasting\PrivateChannel;

/**
 * Kênh WebSocket chung cho luồng thanh lý: quản lý theo tòa + tenant chính.
 */
final class TerminationBroadcastChannels
{
    /**
     * @return array<int, PrivateChannel>
     */
    public static function forContract(Contract $contract): array
    {
        $contract->loadMissing('members');

        $channels = [
            new PrivateChannel('property.'.$contract->property_id),
        ];

        $primary = $contract->members->first(
            fn ($m) => $m->is_primary && $m->user_id !== null
        );

        if ($primary?->user_id) {
            $channels[] = new PrivateChannel('user.'.$primary->user_id);
        }

        return $channels;
    }
}
