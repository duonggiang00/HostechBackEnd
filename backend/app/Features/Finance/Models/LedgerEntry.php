<?php

namespace App\Features\Finance\Models;

use App\Models\Concerns\MultiTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LedgerEntry extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;

    protected $keyType = 'string';

    /** Sổ cái là immutable — chỉ có created_at, không có updated_at */
    const UPDATED_AT = null;

    protected $fillable = [
        'org_id',
        'ref_type',
        'ref_id',
        'debit',
        'credit',
        'occurred_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'debit'       => 'decimal:2',
            'credit'      => 'decimal:2',
            'occurred_at' => 'datetime',
            'meta'        => 'array',
        ];
    }
}
