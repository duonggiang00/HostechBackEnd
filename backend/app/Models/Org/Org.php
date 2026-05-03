<?php

namespace App\Models\Org;

use App\Models\Property\Property;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Org extends Model
{
    use HasFactory, HasUuids, SoftDeletes, SystemLoggable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'phone', 'email', 'address', 'timezone', 'currency', 'bank_accounts', 'settings'];

    protected function casts(): array
    {
        return [
            'bank_accounts' => 'array',
            'settings' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Khi bật: kịch bản B (còn phải thu sau cấn cọc) sẽ tạo thêm một hóa đơn phát hành riêng và gắn yêu cầu thanh toán cuối vào hóa đơn đó (đồng thời điều chỉnh CREDIT trên hóa đơn thanh lý).
     */
    public function requiresTerminationSupplementalInvoiceForOutstanding(): bool
    {
        $v = $this->settings['termination_require_supplemental_invoice_for_outstanding'] ?? false;

        return filter_var($v, FILTER_VALIDATE_BOOLEAN);
    }

    public function properties()
    {
        return $this->hasMany(Property::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
