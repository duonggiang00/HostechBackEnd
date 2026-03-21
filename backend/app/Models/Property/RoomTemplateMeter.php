<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomTemplateMeter extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'room_template_id', 'type'];

    public function template()
    {
        return $this->belongsTo(RoomTemplate::class, 'room_template_id');
    }
}
