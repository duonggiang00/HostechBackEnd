<?php

namespace App\Models\Document;

use App\Models\Org\Org;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class GeneratedDocument extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'org_id',
        'template_id',
        'owner_type',
        'owner_id',
        'path',
        'sha256',
    ];

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class);
    }

    public function owner(): MorphTo
    {
        return $this->morphTo();
    }
}
