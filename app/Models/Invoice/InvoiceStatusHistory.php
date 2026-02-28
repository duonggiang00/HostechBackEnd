<?php

namespace App\Models\Invoice;

use App\Models\Org\User;
use App\Traits\OrgScoped;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceStatusHistory extends Model
{
    use HasFactory, HasUuids, OrgScoped;

    protected $fillable = [
        'org_id',
        'invoice_id',
        'from_status',
        'to_status',
        'note',
        'changed_by_user_id',
    ];

    /**
     * @return BelongsTo
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * @return BelongsTo
     */
    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
