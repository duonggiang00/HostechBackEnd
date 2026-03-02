<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use App\Models\Org\User;

class TemporaryUpload extends \Illuminate\Database\Eloquent\Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia;

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
