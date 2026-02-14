<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Org extends Model
{
    use HasFactory, HasUuids, SoftDeletes, SystemLoggable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'phone', 'email', 'address', 'timezone', 'currency'];

    public function properties()
    {
        return $this->hasMany(Property::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
