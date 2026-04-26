<?php

namespace App\Models\Finance;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentStatusHistory extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'payment_id',
        'from_status',
        'to_status',
        'note',
        'changed_by_user_id',
    ];

    /**
     * Relationship to the payment.
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /**
     * Relationship to the user who made the change.
     */
    public function changer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
