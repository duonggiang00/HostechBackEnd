<?php

namespace App\Features\Property\Models;

use App\Core\Models\Concerns\MultiTenant;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Property extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes, SystemLoggable;
    
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'org_id', 'code', 'name', 'address', 'area', 'shared_area', 'note', 'use_floors', 'default_billing_cycle', 'default_due_day', 'default_cutoff_day', 'bank_accounts', 'default_rent_price_per_m2', 'default_deposit_months'];

    protected function casts(): array
    {
        return [
            'area' => 'decimal:2',
            'shared_area' => 'decimal:2',
            'use_floors' => 'boolean',
            'bank_accounts' => 'array',
            'default_rent_price_per_m2' => 'decimal:2',
            'default_deposit_months' => 'integer',
            'default_due_day' => 'integer',
            'default_cutoff_day' => 'integer',
        ];
    }

    public function floors()
    {
        return $this->hasMany(Floor::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    /**
     * Users (Manager/Staff) assigned to this property
     */
    public function managers()
    {
        return $this->belongsToMany(\App\Features\Org\Models\User::class, 'property_user')
            ->withTimestamps();
    }

    public function contracts()
    {
        return $this->hasMany(\App\Features\Contract\Models\Contract::class);
    }

    public function defaultServices()
    {
        return $this->belongsToMany(\App\Features\Service\Models\Service::class, 'property_default_services')
            ->withTimestamps();
    }
}
