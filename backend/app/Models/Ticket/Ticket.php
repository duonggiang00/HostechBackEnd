<?php

namespace App\Models\Ticket;

use App\Models\Concerns\MultiTenant;
use App\Models\Contract\Contract;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Ticket extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, MultiTenant, SoftDeletes, SystemLoggable;

    /** Tên collection media cho file đính kèm trên ticket (ảnh + pdf). */
    public const MEDIA_ATTACHMENTS = 'ticket_attachments';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'property_id',
        'room_id',
        'contract_id',
        'created_by_user_id',
        'assigned_to_user_id',
        'category',
        'priority',
        'status',
        'description',
        'due_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function events()
    {
        return $this->hasMany(TicketEvent::class);
    }

    public function costs()
    {
        return $this->hasMany(TicketCost::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::MEDIA_ATTACHMENTS)
            ->acceptsMimeTypes([
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/gif',
                'application/pdf',
            ]);
    }

    /**
     * Format media item thành payload tối giản cho FE (kèm URL đã resolve).
     */
    public static function formatAttachment(Media $media): array
    {
        return [
            'id' => $media->id,
            'name' => $media->file_name,
            'mime_type' => $media->mime_type,
            'size' => (int) $media->size,
            'url' => $media->getFullUrl(),
            'created_at' => $media->created_at?->toIso8601String(),
        ];
    }
}
