<?php

namespace App\Events\Property;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BuildingOverviewUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $propertyId,
        public readonly string $userId,
        public readonly array  $summary = [],
    ) {}
}
