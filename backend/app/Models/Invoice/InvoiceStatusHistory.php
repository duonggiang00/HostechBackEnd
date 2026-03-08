<?php

namespace App\Models\Invoice;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoiceStatusHistory extends Model
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
        'from_status',
        'to_status',
        'note',
        'changed_by_user_id',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }
}
