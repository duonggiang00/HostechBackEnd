<?php

namespace App\Models\Contract;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\Org;
use App\Models\Org\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractStatusHistory extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public const EVENT_STATUS_CHANGE = 'STATUS_CHANGE';

    public const EVENT_CONTRACT_CREATED = 'CONTRACT_CREATED';

    public const EVENT_SIGNATURE_TENANT = 'SIGNATURE_TENANT';

    public const EVENT_SIGNATURE_MANAGER = 'SIGNATURE_MANAGER';

    public const EVENT_HANDOVER_SUBMITTED = 'HANDOVER_SUBMITTED';

    public const EVENT_FINAL_INVOICE_GENERATED = 'FINAL_INVOICE_GENERATED';

    public const EVENT_DEBT_RECONCILIATION = 'DEBT_RECONCILIATION';

    public const EVENT_SETTLEMENT_PAYMENT_REQUESTED = 'SETTLEMENT_PAYMENT_REQUESTED';

    public const EVENT_SETTLEMENT_RESOLVED = 'SETTLEMENT_RESOLVED';

    public const EVENT_ROOM_TRANSFER = 'ROOM_TRANSFER';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'contract_id',
        'from_status',
        'to_status',
        'event_type',
        'changed_by_user_id',
        'notes',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }

    /**
     * Ghi nhận một milestone EDA (không kèm thay đổi trạng thái).
     *
     * @param  Contract  $contract  Hợp đồng đang phát sinh sự kiện.
     * @param  string  $eventType  Một trong các hằng số EVENT_* phía trên.
     * @param  string|null  $notes  Ghi chú hiển thị trên timeline.
     * @param  array<string, mixed>  $payload  Dữ liệu thêm (id invoice/handover/...).
     * @param  string|null  $changedByUserId  Override người thực hiện (mặc định auth()->id()).
     * @param  bool  $dedupe  Tránh ghi trùng nếu đã có cùng event + payload trong 60s.
     */
    public static function recordEvent(
        Contract $contract,
        string $eventType,
        ?string $notes = null,
        array $payload = [],
        ?string $changedByUserId = null,
        bool $dedupe = true,
    ): ?self {
        $statusValue = $contract->status instanceof \BackedEnum
            ? $contract->status->value
            : (string) $contract->status;

        $userId = $changedByUserId ?? auth()->id();

        // Loại bỏ key nội bộ trước khi persist (không lưu vào payload)
        unset($payload['__dedupe_key']);

        if ($dedupe) {
            // Tránh ghi trùng milestone trong cửa sổ ngắn (2 phút)
            // Nếu có id rõ ràng trong payload thì so khớp theo id để cho phép cùng event_type
            // nhưng khác đối tượng (vd. nhiều invoice hoàn cọc khác nhau).
            $existing = static::query()
                ->where('contract_id', $contract->id)
                ->where('event_type', $eventType)
                ->when(! empty($payload['id']), function ($q) use ($payload) {
                    $q->whereJsonContains('payload->id', $payload['id']);
                })
                ->where('created_at', '>=', now()->subMinutes(2))
                ->exists();

            if ($existing) {
                return null;
            }
        }

        return static::create([
            'org_id' => $contract->org_id,
            'contract_id' => $contract->id,
            'from_status' => $statusValue ?: null,
            'to_status' => $statusValue,
            'event_type' => $eventType,
            'changed_by_user_id' => $userId,
            'notes' => $notes,
            'payload' => $payload ?: null,
        ]);
    }
}
