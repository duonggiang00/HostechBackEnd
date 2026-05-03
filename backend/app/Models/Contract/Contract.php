<?php

namespace App\Models\Contract;

use App\Enums\ContractCancellationParty;
use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Models\Concerns\MultiTenant;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Traits\SystemLoggable;
use Carbon\Carbon;
use Database\Factories\ContractFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Contract extends Model implements HasMedia
{
    /** @use HasFactory<ContractFactory> */
    use HasFactory, HasUuids, InteractsWithMedia, MultiTenant, SoftDeletes, SystemLoggable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'property_id',
        'room_id',
        'status',
        'start_date',
        'end_date',
        'billing_cycle',
        'due_day',
        'cutoff_day',
        'next_billing_date',
        'rent_price',
        'deposit_amount',
        'deposit_months',
        'deposit_status',
        'refunded_amount',
        'forfeited_amount',
        'join_code',
        'join_code_expires_at',
        'join_code_revoked_at',
        'signed_at',
        'terminated_at',
        'base_rent',
        'fixed_services_fee',
        'total_rent',
        'cycle_months',
        'rent_token_balance',
        'created_by_user_id',
        'document_path',
        'document_type',
        'scan_original_filename',
        'meta',
        'custom_content',
        // ── Termination fields ─────────────────────────────────────────────────────
        'cancellation_party',   // LANDLORD | TENANT | MUTUAL
        'cancellation_reason',  // Lý do huỷ (text tự do)
        'cancelled_at',         // Thời điểm chính thức hủy
        'notice_days',          // Số ngày phải báo trước
        'notice_given_at',      // Thời điểm Tenant gửi thông báo dời
        'expected_move_out_date', // Ngày dự kiến dọn đi (thông báo trả phòng)
    ];

    protected function casts(): array
    {
        return [
            'status' => ContractStatus::class,
            'deposit_status' => DepositStatus::class,
            'cancellation_party' => ContractCancellationParty::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'next_billing_date' => 'date',
            'base_rent' => 'decimal:2',
            'fixed_services_fee' => 'decimal:2',
            'total_rent' => 'decimal:2',
            'cycle_months' => 'integer',
            'notice_days' => 'integer',
            'rent_price' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'deposit_months' => 'integer',
            'refunded_amount' => 'decimal:2',
            'forfeited_amount' => 'decimal:2',
            'rent_token_balance' => 'integer',
            'join_code_expires_at' => 'datetime',
            'join_code_revoked_at' => 'datetime',
            'signed_at' => 'datetime',
            'terminated_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'notice_given_at' => 'datetime',
            'expected_move_out_date' => 'date',
            'meta' => 'array',
        ];
    }

    public function members(): HasMany
    {
        return $this->hasMany(ContractMember::class);
    }

    /**
     * Khách thuê chính — khớp dữ liệu thực tế: role thường là TENANT (không phải PRIMARY),
     * hoặc cờ is_primary. Giữ PRIMARY cho dữ liệu/tách test cũ.
     */
    public function primaryMember(): HasOne
    {
        return $this->hasOne(ContractMember::class)
            ->where(function ($query) {
                $query->whereIn('role', ['PRIMARY', 'TENANT'])
                    ->orWhere('is_primary', true);
            })
            ->orderByRaw("CASE WHEN role = 'PRIMARY' THEN 0 WHEN role = 'TENANT' THEN 1 ELSE 2 END")
            ->orderByDesc('is_primary')
            ->orderBy('created_at');
    }

    /**
     * Số tháng cọc dùng cho API/UI/tài liệu: tin cột `deposit_months` chỉ khi khớp với
     * (total_rent × tháng); nếu lệch (seed cũ, import) thì suy từ deposit_amount / total_rent.
     */
    public function effectiveDepositMonths(): int
    {
        $deposit = (float) $this->deposit_amount;
        $totalRent = (float) ($this->total_rent ?? 0);
        $basis = $totalRent > 0.009
            ? $totalRent
            : (float) $this->rent_price + (float) ($this->fixed_services_fee ?? 0);

        if ($basis <= 0.009 || $deposit <= 0.009) {
            return max(0, (int) ($this->deposit_months ?? 0));
        }

        $stored = (int) ($this->deposit_months ?? 0);
        $tolerance = max(5000.0, abs($deposit) * 0.0005);

        if ($stored > 0) {
            $expected = $basis * $stored;
            if (abs($deposit - $expected) <= $tolerance) {
                return min(24, max(1, $stored));
            }
        }

        $inferred = (int) round($deposit / $basis);

        return $inferred < 1 ? 0 : min(24, $inferred);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Hóa đơn đang có dư nợ (dùng cho badge / phân bổ nợ phòng vs dịch vụ).
     */
    public function outstandingInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class)
            ->whereIn('status', Invoice::outstandingDebtStatuses())
            ->whereRaw('(total_amount - COALESCE(paid_amount, 0)) > 0.009');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(ContractStatusHistory::class)->orderBy('created_at', 'asc');
    }

    /**
     * Ngày thanh lý có trước ngày hết hạn đã thỏa thuận hay không (chuẩn nghiệp vụ).
     *
     * @param  string|null  $terminationDate  Y-m-d — ngày kết thúc thực tế; null thì dùng end_date hiện tại (sau pipeline = ngày thanh lý).
     * @param  string|null  $scheduledEndDate  Y-m-d — ngày hết hạn HĐ gốc; null thì đọc meta `scheduled_end_date` hoặc end_date (hợp đồng chưa thanh lý).
     */
    public function isTerminationBeforeScheduledEnd(?string $terminationDate = null, ?string $scheduledEndDate = null): bool
    {
        $tz = config('app.timezone');
        $schedRaw = $scheduledEndDate
            ?? ($this->meta['termination_details']['scheduled_end_date'] ?? null);

        if ($schedRaw === null && $this->end_date) {
            $schedRaw = $this->end_date->format('Y-m-d');
        }

        if ($schedRaw === null) {
            return false;
        }

        $termRaw = $terminationDate ?? $this->end_date?->format('Y-m-d');
        if ($termRaw === null) {
            return false;
        }

        $term = Carbon::parse($termRaw, $tz)->startOfDay();
        $scheduled = Carbon::parse($schedRaw, $tz)->startOfDay();

        return $term->lt($scheduled);
    }

    /**
     * Tương thích ngược: sau khi thanh lý có meta `scheduled_end_date`, so sánh với end_date (= ngày thanh lý).
     * Trước khi thanh lý (chưa có meta): coi như “hôm nay vẫn trước ngày kết thúc đã lên lịch”.
     */
    public function isEarlyTermination(): bool
    {
        if ($this->meta['termination_details']['scheduled_end_date'] ?? null) {
            return $this->isTerminationBeforeScheduledEnd();
        }

        if (! $this->end_date) {
            return false;
        }

        $tz = config('app.timezone');

        return now()->copy()->timezone($tz)->startOfDay()
            ->lt($this->end_date->copy()->timezone($tz)->startOfDay());
    }
}
