<?php

namespace App\Features\Property\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomTemplateAsset extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'room_template_id', 'name'];

    public function template()
    {
        return $this->belongsTo(RoomTemplate::class, 'room_template_id');
    }
}
