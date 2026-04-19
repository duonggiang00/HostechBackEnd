<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PropertyDefaultService extends Pivot
{
    use HasUuids;

    protected $table = 'property_default_services';

    public $incrementing = false;

    protected $keyType = 'string';
}
