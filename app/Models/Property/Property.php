<?php

namespace App\Models\Property;

use App\Models\Concerns\MultiTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Property extends Model
{
    use HasFactory, HasUuids, SystemLoggable, MultiTenant, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'org_id', 'code', 'name', 'address', 'note', 'use_floors', 'default_billing_cycle', 'default_due_day', 'default_cutoff_day', 'bank_accounts'];

    protected $casts = [
        'use_floors' => 'boolean',
        'bank_accounts' => 'array',
    ];

    public function floors()
    {
        return $this->hasMany(Floor::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
