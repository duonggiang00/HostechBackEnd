<?php

namespace App\Features\Property\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomTemplateMeter extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'room_template_id', 'type', 'service_id'];

    public function template()
    {
        return $this->belongsTo(RoomTemplate::class, 'room_template_id');
    }

    public function service()
    {
        return $this->belongsTo(\App\Features\Service\Models\Service::class, 'service_id');
    }
}
