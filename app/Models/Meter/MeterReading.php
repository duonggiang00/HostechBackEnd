<?php

namespace App\Models\Meter;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\Org;
use App\Models\Org\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeterReading extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'org_id', 'meter_id', 'period_start', 'period_end', 'reading_value',
        'status', 'submitted_by_user_id', 'submitted_at', 'approved_by_user_id',
        'approved_at', 'locked_at', 'meta' // Thêm meta
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'reading_value' => 'integer',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'locked_at' => 'datetime',
        'meta' => 'array', // Thêm cast json
    ];

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function meter()
    {
        return $this->belongsTo(Meter::class);
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
