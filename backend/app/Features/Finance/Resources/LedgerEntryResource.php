<?php

namespace App\Features\Finance\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LedgerEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'ref_type'    => $this->ref_type,
            'ref_id'      => $this->ref_id,
            'debit'       => (float) $this->debit,
            'credit'      => (float) $this->credit,
            'net'         => (float) $this->debit - (float) $this->credit,
            'meta'        => $this->meta,
            'occurred_at' => $this->occurred_at?->toIso8601String(),
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}
