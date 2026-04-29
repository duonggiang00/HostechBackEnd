<?php

namespace App\Models\Contract;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Traits\HasMediaAttachments;
use App\Traits\SystemLoggable;
use Database\Factories\ContractMemberFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ContractMember extends Model implements HasMedia
{
    /** @use HasFactory<ContractMemberFactory> */
    use HasFactory, HasMediaAttachments, HasUuids, InteractsWithMedia, MultiTenant, SoftDeletes, SystemLoggable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'contract_id',
        'user_id',
        'email',            // snapshot identity — cũng dùng để backfill user_id khi tenant đăng ký
        'full_name',
        'phone',
        'identity_number',
        'role',
        'status',
        'is_primary',
        'joined_at',
        'signed_at',
        'left_at',
        'date_of_birth',
        'gender',
        'nationality',
        'license_plate',
        'permanent_address',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'joined_at' => 'datetime',
            'signed_at' => 'datetime',
            'left_at' => 'datetime',
            'date_of_birth' => 'date',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('identity_front')->singleFile();
        $this->addMediaCollection('identity_back')->singleFile();
    }
}
