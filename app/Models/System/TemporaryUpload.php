<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use App\Models\Org\User;

class TemporaryUpload extends Model implements HasMedia
{
    use HasUuids, InteractsWithMedia;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
