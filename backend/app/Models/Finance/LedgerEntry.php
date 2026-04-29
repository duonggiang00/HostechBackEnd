<?php

namespace App\Models\Finance;

use App\Models\Concerns\MultiTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LedgerEntry extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public const ACCOUNT_CASH_BANK = 'CASH_BANK';

    public const ACCOUNT_ACCOUNTS_RECEIVABLE = 'ACCOUNTS_RECEIVABLE';

    public $incrementing = false;

    protected $keyType = 'string';

    /** Sổ cái là immutable — chỉ có created_at, không có updated_at */
    const UPDATED_AT = null;

    protected $fillable = [
        'org_id',
        'ref_type',
        'ref_id',
        'debit',
        'credit',
        'occurred_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
            'occurred_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    /**
     * Các dòng sổ cái phản ánh dòng tiền thực (tiền mặt/CK) + thu/chi thủ công.
     * Loại trừ bút kép trên A/R (debit/credit đối ứng cùng payment không phải 2 lần vào/ra quỹ).
     */
    public function scopeForCashflowReport(Builder $query): Builder
    {
        return $query->where(function (Builder $w) {
            $w->where(function (Builder $x) {
                $x->where('ref_type', 'payment')
                    ->where('meta->account', self::ACCOUNT_CASH_BANK);
            })->orWhere(function (Builder $x) {
                $x->where('ref_type', 'payment_reversal')
                    ->where('meta->account', self::ACCOUNT_CASH_BANK);
            })->orWhere('ref_type', 'cashflow_manual');
        });
    }

    /**
     * Chỉ nhánh tiền mặt/ngân hàng của payment / payment_reversal (KPI sổ cái).
     */
    public function scopeForLedgerCashKpis(Builder $query): Builder
    {
        return $query->where(function (Builder $w) {
            $w->where(function (Builder $x) {
                $x->where('ref_type', 'payment')
                    ->where('meta->account', self::ACCOUNT_CASH_BANK);
            })->orWhere(function (Builder $x) {
                $x->where('ref_type', 'payment_reversal')
                    ->where('meta->account', self::ACCOUNT_CASH_BANK);
            });
        });
    }
}
