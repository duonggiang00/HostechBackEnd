<?php

namespace App\Models\Invoice;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoiceAdjustment extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * Bảng chỉ có created_at, không có updated_at.
     */
    const UPDATED_AT = null;

    protected $fillable = [
        'org_id',
        'invoice_id',
        'type',
        'amount',
        'reason',
        'created_by_user_id',
        'approved_by_user_id',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Kiểm tra xem adjustment đã được duyệt chưa.
     */
    public function isApproved(): bool
    {
        return $this->approved_at !== null;
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
