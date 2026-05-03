<?php

namespace App\Services\Contract;

use App\Enums\ContractCancellationParty;
use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Enums\InvoiceItemType;
use App\Enums\PenaltyRuleType;
use App\Events\Contract\ContractRenewalRequested;
use App\Events\Contract\RoomTransferRequested;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Finance\PenaltyRule;
use App\Models\Invoice\Invoice;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Service\Service;
use App\Notifications\Contract\ContractSignatureRequested;
use App\Services\Contract\Termination\ContractTerminationPipelineService;
use App\Services\Invoice\InvoiceService;
use App\Services\Service\ServiceService;
use App\Services\System\UserInvitationService;
use App\Support\MeterInvoiceDescription;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class ContractService
{
    protected ?bool $contractMembersHasSignedAtColumn = null;

    public function __construct(
        protected InvoiceService $invoiceService,
        protected ServiceService $serviceService,
    ) {}

    /**
     * Aggregate status counts for KPI cards (single query).
     * Uses the same role-based scoping as paginate().
     */
    public function getStatusCounts(?User $user = null, ?string $propertyId = null): array
    {
        $query = Contract::query();

        if ($propertyId) {
            $query->where('property_id', $propertyId);
        }

        // Same role-based scoping as paginate
        if ($user) {
            if ($user->hasRole('Tenant')) {
                $query->whereHas('members', fn ($q) => $q->where('user_id', $user->id));
            } elseif ($user->hasRole(['Manager', 'Staff'])) {
                $query->whereHas('property.managers', fn ($q) => $q->where('user_id', $user->id));
            } elseif (! $user->hasRole('Admin')) {
                $query->where('org_id', $user->org_id);
            }
        }

        $now = now()->toDateString();
        $in30 = now()->addDays(30)->toDateString();
        $outstandingStatuses = Invoice::outstandingDebtStatuses();
        $outstandingIn = implode(',', array_fill(0, count($outstandingStatuses), '?'));

        // Single query: all status counts + expiring (conditional aggregate)
        $row = $query
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as draft_count', [ContractStatus::DRAFT])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_sig_count', [ContractStatus::PENDING_SIGNATURE])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_pay_count', [ContractStatus::PENDING_PAYMENT])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active_count', [ContractStatus::ACTIVE])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_termination_count', [ContractStatus::PENDING_TERMINATION])
            // Legacy support: dữ liệu cũ từng lưu ENDED, giữ đếm riêng để FE chuyển tiếp dần.
            ->selectRaw("SUM(CASE WHEN status = 'ENDED' THEN 1 ELSE 0 END) as ended_count")
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as terminated_count', [ContractStatus::TERMINATED])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as expired_count', [ContractStatus::EXPIRED])
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled_count', [ContractStatus::CANCELLED])
            ->selectRaw('SUM(CASE WHEN status = ? AND end_date IS NOT NULL AND end_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as expiring_count', [ContractStatus::ACTIVE, $now, $in30])
            ->selectRaw("SUM(CASE WHEN EXISTS (
                SELECT 1 FROM invoices
                WHERE invoices.contract_id = contracts.id
                AND invoices.deleted_at IS NULL
                AND invoices.status IN ({$outstandingIn})
                AND (invoices.total_amount - COALESCE(invoices.paid_amount, 0)) > 0.009
            ) THEN 1 ELSE 0 END) as invoice_debt_count", $outstandingStatuses)
            ->first();

        return [
            'total' => (int) ($row->total ?? 0),
            'DRAFT' => (int) ($row->draft_count ?? 0),
            'PENDING_SIGNATURE' => (int) ($row->pending_sig_count ?? 0),
            'PENDING_PAYMENT' => (int) ($row->pending_pay_count ?? 0),
            'ACTIVE' => (int) ($row->active_count ?? 0),
            'PENDING_TERMINATION' => (int) ($row->pending_termination_count ?? 0),
            'ENDED' => (int) ($row->ended_count ?? 0),
            'TERMINATED' => (int) ($row->terminated_count ?? 0),
            'EXPIRED' => (int) ($row->expired_count ?? 0),
            'CANCELLED' => (int) ($row->cancelled_count ?? 0),
            'expiring' => (int) ($row->expiring_count ?? 0),
            'invoice_debt' => (int) ($row->invoice_debt_count ?? 0),
        ];
    }

    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?User $user = null): LengthAwarePaginator
    {
        // Phải truyền instance AllowedSort vào defaultSort — chuỗi 'room_order' bị Spatie coi là sort theo cột DB (contracts.room_order không tồn tại).
        $sortByRoomOrder = AllowedSort::callback('room_order', function ($query, bool $descending): void {
            $dir = $descending ? 'desc' : 'asc';
            $query->orderByRaw("(select floor_number from rooms where rooms.id = contracts.room_id limit 1) {$dir}")
                ->orderByRaw("(select code from rooms where rooms.id = contracts.room_id limit 1) {$dir}");
        });

        $query = QueryBuilder::for(Contract::class)
            ->allowedFilters(array_merge($allowedFilters, [
                AllowedFilter::exact('org_id'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('status'),
            ]))
            ->allowedSorts([
                'start_date',
                'end_date',
                'created_at',
                'status',
                'rent_price',
                $sortByRoomOrder,
            ])
            ->defaultSort($sortByRoomOrder)
            ->with([
                'room',
                'property',
                'members.user',
                'outstandingInvoices',
            ]);

        // Role-based scoping
        if ($user) {
            if ($user->hasRole('Tenant')) {
                // Tenant chỉ thấy hợp đồng mà mình là thành viên
                $query->whereHas('members', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            } elseif ($user->hasRole(['Manager', 'Staff'])) {
                $query->whereHas('property.managers', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            } elseif (! $user->hasRole('Admin')) {
                // Các role khác (Owner) thấy trong org của mình
                $query->where('org_id', $user->org_id);
            }
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('join_code', 'like', "%{$search}%")
                    ->orWhereHas('members.user', function ($uq) use ($search) {
                        $uq->where('full_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?User $user = null): LengthAwarePaginator
    {
        $query = QueryBuilder::for(Contract::onlyTrashed())
            ->allowedFilters($allowedFilters)
            ->allowedSorts(['start_date', 'end_date', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['room', 'property']);

        // Role-based scoping
        if ($user) {
            if ($user->hasRole('Tenant')) {
                $query->whereHas('members', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            } elseif ($user->hasRole(['Manager', 'Staff'])) {
                $query->whereHas('property.managers', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
            } elseif (! $user->hasRole('Admin')) {
                $query->where('org_id', $user->org_id);
            }
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('join_code', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?Contract
    {
        return Contract::with([
            'room',
            'property',
            'members' => fn ($q) => $q->with(['user', 'media']),
            'createdBy',
            'invoices',
            'statusHistories',
        ])->find($id);
    }

    public function findTrashed(string $id): ?Contract
    {
        return Contract::onlyTrashed()->with(['room', 'property'])->find($id);
    }

    public function findWithTrashed(string $id): ?Contract
    {
        return Contract::withTrashed()->with(['room', 'property'])->find($id);
    }

    /**
     * Create Contract and potentially Members.
     *
     * Nếu có member với user_id (Tenant chờ ký) → contract tự chuyển PENDING_SIGNATURE.
     * Member có user_id sẽ nhận status PENDING (chờ Tenant accept).
     */
    public function create(array $data, ?User $user = null): Contract
    {
        return DB::transaction(function () use ($data, $user) {
            $contractData = collect($data)->except(['members'])->toArray();

            // Auto-assign org_id if missing. Admin can pass it, others use their own.
            if (! isset($contractData['org_id'])) {
                $contractData['org_id'] = $user?->org_id;
            }

            $contractData['created_by_user_id'] = $user?->id;

            if (! isset($contractData['join_code'])) {
                $contractData['join_code'] = $this->generateJoinCode();
            }

            // --- TEMPLATE-BASED DEFAULTS ---
            $roomId = $contractData['room_id'] ?? null;
            $propertyId = $contractData['property_id'] ?? null;
            $startDate = $contractData['start_date'] ?? null;
            $endDate = $contractData['end_date'] ?? null;

            $property = $propertyId ? Property::find($propertyId) : null;
            $room = $roomId ? Room::find($roomId) : null;

            if ($property && $user?->org_id && ! $user->hasRole('Admin') && $property->org_id !== $user->org_id) {
                throw ValidationException::withMessages([
                    'property_id' => 'Bạn không thể tạo hợp đồng ngoài tổ chức hiện tại.',
                ]);
            }

            if ($property && $room && $room->property_id !== $property->id) {
                throw ValidationException::withMessages([
                    'room_id' => 'Phòng không thuộc bất động sản đã chọn.',
                ]);
            }

            if ($room && $room->status === 'maintenance') {
                throw ValidationException::withMessages([
                    'room_id' => 'Phòng đang bảo trì, không thể tạo hợp đồng mới.',
                ]);
            }

            // Check for overlap
            if ($roomId && $startDate) {
                $overlap = $this->checkOverlap($roomId, $startDate, $endDate);
                if ($overlap) {
                    $overlapDate = $overlap->start_date.($overlap->end_date ? ' - '.$overlap->end_date : ' (Vô thời hạn)');
                    throw ValidationException::withMessages([
                        'room_id' => "Phòng này đã có hợp đồng trùng lặp trong khoảng thời gian này ($overlapDate).",
                    ]);
                }
            }

            if ($property) {
                $contractData['billing_cycle'] = $this->normalizeBillingCycleValue(
                    $contractData['billing_cycle'] ?? $property->default_billing_cycle ?? 1
                );
                $contractData['due_day'] = $contractData['due_day'] ?? $property->default_due_day ?? 5;
                $contractData['cutoff_day'] = $contractData['cutoff_day'] ?? $property->default_cutoff_day ?? 25;

                // If rent_price not provided, use Room's base_price or Property default
                if (empty($contractData['rent_price'])) {
                    $contractData['rent_price'] = $room->base_price ?? 0;
                }
            }
            // -------------------------------

            if ((float) ($contractData['rent_price'] ?? 0) <= 0) {
                throw ValidationException::withMessages([
                    'rent_price' => 'Giá thuê phải lớn hơn 0 sau khi áp dụng mặc định của phòng/tòa nhà.',
                ]);
            }

            // Removed cutoff_day > due_day check to allow flexible billing patterns (e.g., prepaid/postpaid)

            $this->ensureEndDateMeetsBillingCycle(
                $contractData['start_date'] ?? null,
                $contractData['end_date'] ?? null,
                $contractData['billing_cycle'] ?? 1,
            );

            // --- FINANCIAL CALCULATION ---
            $rentPrice = (float) ($contractData['rent_price'] ?? 0);
            $contractData['base_rent'] = $rentPrice;

            $orgId = $contractData['org_id'] ?? $room?->org_id ?? $property?->org_id ?? $user?->org_id;
            if (! $orgId) {
                throw ValidationException::withMessages([
                    'org_id' => 'Không xác định được tổ chức để tạo hợp đồng.',
                ]);
            }
            $contractData['org_id'] = $orgId;
            $fixedServicesFee = 0;

            if ($roomId) {
                $roomServices = $this->serviceService->getRoomServices($roomId, (string) $orgId);
                foreach ($roomServices as $rs) {
                    // Only include fixed/recurring services (not metered)
                    if ($rs->service->calc_mode !== 'PER_METER') {
                        $fixedServicesFee += (float) ($rs->service->current_price * $rs->quantity);
                    }
                }
            }

            $contractData['fixed_services_fee'] = $fixedServicesFee;
            $contractData['total_rent'] = $rentPrice + $fixedServicesFee;

            // Số tháng cọc — luôn lưu rõ trên cột mới `deposit_months`. Ưu tiên giá trị FE gửi,
            // fallback về `property.default_deposit_months`, clamp 1..24 để chống dữ liệu bẩn.
            $depositMonths = (int) ($contractData['deposit_months']
                ?? ($property?->default_deposit_months ?? 1));
            $depositMonths = max(1, min(24, $depositMonths));
            $contractData['deposit_months'] = $depositMonths;

            // Lưu ý: empty(0) === true, nên cọc = 0đ vẫn rơi vào auto-calc — giữ behavior cũ.
            if (empty($contractData['deposit_amount'])) {
                $contractData['deposit_amount'] = (float) $contractData['total_rent'] * $depositMonths;
            }

            // Calculate next_billing_date for the first time
            $startDate = Carbon::parse($contractData['start_date']);
            $monthsToAdd = $this->resolveBillingCycleMonths($contractData['billing_cycle'] ?? 1);
            $contractData['next_billing_date'] = $startDate->copy()->addMonths($monthsToAdd)->format('Y-m-d');
            // -----------------------------

            $contract = Contract::create($contractData);

            $hasPendingTenant = false;
            $primaryCount = collect($data['members'] ?? [])->where('is_primary', true)->count();

            if ($primaryCount !== 1) {
                throw ValidationException::withMessages([
                    'members' => 'Hợp đồng phải có đúng 1 người thuê chính.',
                ]);
            }

            if (isset($data['members']) && is_array($data['members'])) {
                foreach ($data['members'] as $memberData) {
                    $member = $this->addMember($contract, $memberData, $user);

                    // Contract needs signature if any member is PENDING or PENDING_INVITE
                    if (in_array($member->status, ['PENDING', 'PENDING_INVITE'])) {
                        $hasPendingTenant = true;
                    }
                }
            }

            // Hợp đồng có cư dân đã đăng ký luôn phải đi qua ký điện tử trước.
            if ($hasPendingTenant) {
                $contract->update(['status' => ContractStatus::PENDING_SIGNATURE]);
            }

            return $contract->refresh();
        });
    }

    /**
     * Update Contract
     */
    public function update(string $id, array $data): ?Contract
    {
        $contract = $this->find($id);
        if (! $contract) {
            return null;
        }

        return DB::transaction(function () use ($contract, $data) {
            if (! in_array($contract->status, ContractStatus::allowEdit())) {
                $statusLabel = $contract->status->label();
                throw new \Exception("Không thể sửa hợp đồng ở trạng thái {$statusLabel}.");
            }

            // Check for overlap if room or dates change
            $roomId = $data['room_id'] ?? $contract->room_id;
            $startDate = $data['start_date'] ?? $contract->start_date;
            $endDate = $data['end_date'] ?? $contract->end_date;

            if ($roomId && $startDate) {
                $overlap = $this->checkOverlap($roomId, $startDate, $endDate, $contract->id);
                if ($overlap) {
                    $overlapDate = $overlap->start_date.($overlap->end_date ? ' - '.$overlap->end_date : ' (Vô thời hạn)');
                    throw new \Exception("Phòng này đã có hợp đồng trùng lặp trong khoảng thời gian này ($overlapDate).");
                }
            }

            if (array_key_exists('billing_cycle', $data)) {
                $data['billing_cycle'] = $this->normalizeBillingCycleValue($data['billing_cycle']);
            }

            if (array_key_exists('cutoff_day', $data)) {
                $data['cutoff_day'] = (int) $data['cutoff_day'];
            }

            if (array_key_exists('start_date', $data) || array_key_exists('billing_cycle', $data)) {
                $startDate = Carbon::parse($data['start_date'] ?? $contract->start_date);
                $monthsToAdd = $this->resolveBillingCycleMonths($data['billing_cycle'] ?? $contract->billing_cycle);
                $data['next_billing_date'] = $startDate->copy()->addMonths($monthsToAdd)->format('Y-m-d');
            }

            $this->ensureEndDateMeetsBillingCycle(
                $data['start_date'] ?? $contract->start_date,
                array_key_exists('end_date', $data) ? $data['end_date'] : $contract->end_date,
                $data['billing_cycle'] ?? $contract->billing_cycle,
            );

            $contract->update($data);

            return $contract->refresh();
        });
    }

    /**
     * Hợp đồng đang hiệu lực không được xóa mềm / xóa cứng qua API.
     */
    private function assertContractNotActiveForDeletion(Contract $contract): void
    {
        if ($contract->status === ContractStatus::ACTIVE) {
            throw ValidationException::withMessages([
                'contract' => 'Không thể xóa hợp đồng đang hiệu lực. Vui lòng thanh lý hợp đồng (kết thúc đúng hạn hoặc thanh lý sớm) trước, sau đó mới có thể đưa vào thùng rác hoặc xóa vĩnh viễn.',
            ]);
        }
    }

    /**
     * Xóa mềm hợp đồng.
     *
     * Nếu contract đang ở PENDING_PAYMENT → auto-cancel Initial Invoice.
     */
    public function delete(string $id): bool
    {
        $contract = $this->find($id);
        if (! $contract) {
            return false;
        }

        $this->assertContractNotActiveForDeletion($contract);

        return DB::transaction(function () use ($contract) {
            // Auto-cancel initial invoice nếu contract đang chờ thanh toán
            if ($contract->status === ContractStatus::PENDING_PAYMENT) {
                $this->cancelInitialInvoice($contract);
            }

            return $contract->delete();
        });
    }

    public function restore(string $id): bool
    {
        $contract = $this->findTrashed($id);
        if ($contract) {
            return $contract->restore();
        }

        return false;
    }

    public function forceDelete(string $id): bool
    {
        $contract = $this->findWithTrashed($id);
        if (! $contract) {
            return false;
        }

        $this->assertContractNotActiveForDeletion($contract);

        return $contract->forceDelete();
    }

    /**
     * Accept Contract Signature (Tenant).
     *
     * Luồng mới:
     * 1. Approve member
     * 2. Tạo Initial Invoice (tiền phòng tháng đầu + tiền cọc)
     * 3. Contract → PENDING_PAYMENT (chờ Admin xác nhận thanh toán)
     */
    public function signContract(Contract $contract, string $base64Image): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(401, 'Unauthorized');
        }

        if (! in_array($contract->status, ContractStatus::allowAcceptSignature(), true)) {
            throw ValidationException::withMessages([
                'contract' => 'Hợp đồng không ở trạng thái cho phép ký điện tử.',
            ]);
        }

        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $base64Data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]);

            if (! in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                abort(400, 'Định dạng ảnh chữ ký không hợp lệ');
            }

            $isManager = $user->hasRole(['Admin', 'Manager', 'Staff']);
            $rolePrefix = $isManager ? 'manager' : 'tenant';
            $signatureKey = $isManager ? 'signature_landlord' : 'signature_tenant';

            // Chặn ký lặp lần 2 cho cùng một bên.
            if ($isManager && ! empty($contract->meta['manager_signed_at'])) {
                throw ValidationException::withMessages([
                    'signature' => 'Bên cho thuê đã ký trước đó, không thể ký lại.',
                ]);
            }

            $tenantMember = null;
            if (! $isManager) {
                if (! empty($contract->meta['tenant_signed_at'])) {
                    throw ValidationException::withMessages([
                        'signature' => 'Bên thuê đã ký trước đó, không thể ký lại.',
                    ]);
                }

                $tenantMember = ContractMember::query()
                    ->where('contract_id', $contract->id)
                    ->where('user_id', $user->id)
                    ->whereNull('left_at')
                    ->first();

                if (! $tenantMember) {
                    throw ValidationException::withMessages([
                        'signature' => 'Bạn không phải thành viên hợp lệ của hợp đồng này.',
                    ]);
                }

                if (
                    $this->contractMembersHasSignedAtColumn()
                    && ! empty($tenantMember->signed_at)
                ) {
                    throw ValidationException::withMessages([
                        'signature' => 'Bạn đã ký trước đó, không thể ký lại.',
                    ]);
                }

                if (! in_array((string) $tenantMember->status, ['PENDING', 'APPROVED'], true)) {
                    throw ValidationException::withMessages([
                        'signature' => 'Thành viên không ở trạng thái có thể ký.',
                    ]);
                }
            }

            $imageName = 'signature_'.$rolePrefix.'_'.$contract->id.'-'.$user->id.'.'.$type;
            $storageFilePath = 'contracts/signatures/'.$imageName;
            Storage::disk('local')->put($storageFilePath, base64_decode($base64Data));

            // Build extra data for document generation:
            // always include current signer's signature AND the other party's existing signature if present.
            $extraData = [$signatureKey => $storageFilePath];

            $otherRole = $isManager ? 'tenant' : 'manager';
            $otherKey = $isManager ? 'signature_tenant' : 'signature_landlord';
            foreach (Storage::disk('local')->files('contracts/signatures') as $file) {
                if (str_starts_with(basename($file), 'signature_'.$otherRole.'_'.$contract->id.'-')) {
                    $extraData[$otherKey] = $file;
                    break;
                }
            }

            $contractDocService = app(ContractDocumentService::class);
            $docPath = $contractDocService->generateDocument($contract, $extraData);

            $ext = pathinfo($docPath, PATHINFO_EXTENSION);
            // Cập nhật Meta để lưu thời điểm ký (Kích hoạt Observer)
            $meta = $contract->meta ?? [];
            if ($isManager) {
                $meta['manager_signed_at'] = now();
            } else {
                $meta['tenant_signed_at'] = now();
            }

            $contract->update([
                'document_path' => $docPath,
                'document_type' => strtoupper($ext),
                'meta' => $meta,
            ]);

            // Nếu người thuê ký thì cập nhật trạng thái member và kiểm tra chuyển trạng thái
            if (! $isManager) {
                $success = $this->acceptSignature($contract, $user, $tenantMember);
                if (! $success) {
                    abort(403, 'Bạn không thể Ký do không nằm trong hợp đồng hoặc hợp đồng sai trạng thái.');
                }
            } else {
                // Nếu Manager ký, kiểm tra xem Tenant đã ký hết chưa để chuyển PENDING_PAYMENT
                if (in_array($contract->status, ContractStatus::allowAcceptSignature(), true) && $this->allSignersApproved($contract)) {
                    $this->finalizeContractSignature($contract, $user);
                }
            }
        } else {
            abort(400, 'Dữ liệu ảnh chữ ký không đúng định dạng');
        }
    }

    /**
     * Xác nhận ký hợp đồng (không có ảnh chữ ký mộc)
     */
    public function acceptSignature(Contract $contract, User $user, ?ContractMember $memberHint = null): bool
    {
        $member = $memberHint;
        if (! $member) {
            $member = ContractMember::where('contract_id', $contract->id)
                ->where('user_id', $user->id)
                ->whereNull('left_at')
                ->whereIn('status', ['PENDING', 'APPROVED'])
                ->first();
        }

        if (! $member) {
            return false;
        }

        return DB::transaction(function () use ($contract, $member, $user) {
            // 1. Chuẩn hoá trạng thái ký của member:
            // - PENDING -> APPROVED
            // - APPROVED giữ nguyên
            // - signed_at chỉ set nếu chưa có (tránh ghi đè dấu mốc cũ)
            $memberUpdateData = [];

            if ((string) $member->status === 'PENDING') {
                $memberUpdateData['status'] = 'APPROVED';
                $memberUpdateData['joined_at'] = now();
            }

            if ($this->contractMembersHasSignedAtColumn() && empty($member->signed_at)) {
                $memberUpdateData['signed_at'] = now();
            }

            if (! empty($memberUpdateData)) {
                $member->update($memberUpdateData);
            }

            // 2. Kiểm tra nếu đủ điều kiện (Cả Manager và Tenant đều đã ký)
            if (in_array($contract->status, ContractStatus::allowAcceptSignature(), true) && $this->allSignersApproved($contract)) {
                $this->finalizeContractSignature($contract, $user);
            }

            return true;
        });
    }

    /**
     * Hoàn tất quá trình ký kết và chuyển sang trạng thái chờ thanh toán.
     */
    private function finalizeContractSignature(Contract $contract, User $user): void
    {
        if (! $this->hasInitialInvoice($contract)) {
            $this->createInitialInvoice($contract, $user);
        }

        // 3. Contract → PENDING_PAYMENT
        $contract->update([
            'status' => ContractStatus::PENDING_PAYMENT,
            'signed_at' => now(),
        ]);

        // 4. Generate Final Document with ALL Signatures
        $contractDocService = app(ContractDocumentService::class);
        $docPath = $contractDocService->generateDocument($contract);

        $contract->update([
            'document_path' => $docPath,
        ]);
    }

    /**
     * Reject Contract Signature (Tenant).
     *
     * Member → REJECTED, Contract quay lại DRAFT
     * (cho phép Admin gán Tenant khác).
     */
    public function rejectSignature(Contract $contract, User $user): bool
    {
        $member = ContractMember::where('contract_id', $contract->id)
            ->where('user_id', $user->id)
            ->where('status', 'PENDING')
            ->first();

        if (! $member) {
            return false;
        }

        return DB::transaction(function () use ($contract, $member) {
            $member->update(['status' => 'REJECTED']);

            // Quay contract về DRAFT để Admin có thể gán Tenant khác
            if ($contract->status === ContractStatus::PENDING_SIGNATURE) {
                $contract->update(['status' => ContractStatus::DRAFT]);
            }

            return true;
        });
    }

    /**
     * Logic for listing contracts pending signature for a specific user
     */
    public function myPendingContracts(User $user): \Illuminate\Database\Eloquent\Collection
    {
        return Contract::whereHas('members', function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->where('status', 'PENDING');
        })->with('property:id,name', 'room:id,code,name')->get();
    }

    /**
     * Logic for listing ALL contracts for a specific user (Tenant view)
     */
    public function myContracts(User $user): \Illuminate\Database\Eloquent\Collection
    {
        return Contract::whereHas('members', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with('property:id,name', 'room:id,code,name')->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get available rooms for transfer within the same property
     */
    public function getAvailableRoomsForTransfer(Contract $contract): \Illuminate\Database\Eloquent\Collection
    {
        return Room::where('property_id', $contract->property_id)
            ->where('status', 'available')
            ->where('id', '!=', $contract->room_id)
            ->select(['id', 'code', 'name', 'area', 'base_price', 'floor_number', 'capacity'])
            ->get();
    }

    /**
     * Request a room transfer
     */
    public function requestRoomTransfer(Contract $contract, User $user, array $data): bool
    {
        $targetRoom = Room::where('id', $data['target_room_id'])
            ->where('property_id', $contract->property_id)
            ->where('status', 'available')
            ->first();

        if (! $targetRoom) {
            return false;
        }

        $transferRequests = $contract->meta['transfer_requests'] ?? [];
        $transferRequests[] = [
            'requested_by' => $user->id,
            'from_room_id' => $contract->room_id,
            'to_room_id' => $targetRoom->id,
            'reason' => $data['reason'] ?? null,
            'status' => 'PENDING',
            'requested_at' => now()->toISOString(),
        ];

        $updated = $contract->update([
            'meta' => array_merge($contract->meta ?? [], ['transfer_requests' => $transferRequests]),
        ]);

        if ($updated) {
            $contract->refresh();
            $latest = collect($contract->meta['transfer_requests'] ?? [])->last();
            if (is_array($latest)) {
                RoomTransferRequested::dispatch(
                    (string) $contract->id,
                    (string) $contract->property_id,
                    (string) $contract->org_id,
                    (string) $user->id,
                    isset($latest['to_room_id']) ? (string) $latest['to_room_id'] : null,
                    (string) ($latest['requested_at'] ?? now()->toIso8601String()),
                );
            }
        }

        return $updated;
    }

    /**
     * Tenant gửi yêu cầu gia hạn hợp đồng.
     */
    public function requestRenewal(Contract $contract, User $user, array $data): bool
    {
        if ($contract->status !== ContractStatus::ACTIVE) {
            abort(422, 'Chỉ có thể gửi yêu cầu gia hạn khi hợp đồng đang hiệu lực.');
        }

        $renewalRequests = $contract->meta['renewal_requests'] ?? [];
        $renewalRequests[] = [
            'requested_by' => $user->id,
            'requested_end_date' => Carbon::parse($data['requested_end_date'])->toDateString(),
            'reason' => $data['reason'] ?? null,
            'status' => 'PENDING',
            'requested_at' => now()->toIso8601String(),
        ];

        $updated = $contract->update([
            'meta' => array_merge($contract->meta ?? [], ['renewal_requests' => $renewalRequests]),
        ]);

        if ($updated) {
            $contract->refresh();
            $latest = collect($contract->meta['renewal_requests'] ?? [])->last();
            if (is_array($latest)) {
                ContractRenewalRequested::dispatch(
                    (string) $contract->id,
                    (string) $contract->property_id,
                    (string) $contract->org_id,
                    (string) $user->id,
                    (string) ($latest['requested_end_date'] ?? ''),
                    (string) ($latest['requested_at'] ?? now()->toIso8601String()),
                );
            }
        }

        return $updated;
    }

    /**
     * Duyệt yêu cầu gia hạn (Owner/Manager/Staff) và cập nhật end_date hợp đồng.
     * Chỉ duyệt khi hợp đồng không còn hóa đơn nợ.
     */
    public function approveRenewalRequest(Contract $contract, User $approver, ?int $requestIndex = null): Contract
    {
        if ($contract->status !== ContractStatus::ACTIVE) {
            abort(422, 'Chỉ duyệt gia hạn khi hợp đồng đang hiệu lực.');
        }

        return DB::transaction(function () use ($contract, $approver, $requestIndex) {
            $contract->refresh();

            $outstandingCount = Invoice::query()
                ->where('contract_id', $contract->id)
                ->whereIn('status', Invoice::outstandingDebtStatuses())
                ->whereRaw('(total_amount - COALESCE(paid_amount, 0)) > 0.009')
                ->count();

            if ($outstandingCount > 0) {
                abort(422, "Không thể duyệt gia hạn: hợp đồng còn {$outstandingCount} hóa đơn chưa thanh toán.");
            }

            $renewalRequests = $contract->meta['renewal_requests'] ?? [];
            if (! is_array($renewalRequests) || count($renewalRequests) === 0) {
                abort(422, 'Không tìm thấy yêu cầu gia hạn.');
            }

            $targetIndex = $requestIndex;
            if ($targetIndex === null) {
                $targetIndex = collect($renewalRequests)
                    ->keys()
                    ->last(fn ($idx) => ($renewalRequests[$idx]['status'] ?? '') === 'PENDING');
            }

            if (! is_int($targetIndex) || ! isset($renewalRequests[$targetIndex])) {
                abort(422, 'Yêu cầu gia hạn không hợp lệ.');
            }

            $target = $renewalRequests[$targetIndex];
            if (($target['status'] ?? '') !== 'PENDING') {
                abort(422, 'Yêu cầu gia hạn này không còn ở trạng thái chờ duyệt.');
            }

            $requestedEndDate = Carbon::parse((string) ($target['requested_end_date'] ?? ''))->toDateString();
            $currentEndDate = $contract->end_date ? Carbon::parse($contract->end_date)->toDateString() : null;
            if ($currentEndDate && $requestedEndDate <= $currentEndDate) {
                abort(422, 'Ngày kết thúc đề nghị gia hạn không hợp lệ.');
            }

            $renewalRequests[$targetIndex]['status'] = 'APPROVED';
            $renewalRequests[$targetIndex]['reviewed_by'] = $approver->id;
            $renewalRequests[$targetIndex]['reviewed_at'] = now()->toIso8601String();

            $contract->update([
                'end_date' => $requestedEndDate,
                'meta' => array_merge($contract->meta ?? [], [
                    'renewal_requests' => $renewalRequests,
                    'latest_renewal_approved_at' => now()->toIso8601String(),
                    'latest_renewal_approved_by' => $approver->id,
                ]),
            ]);

            return $contract->refresh();
        });
    }

    /**
     * General Add Member logic — 3 paths based on identity input.
     *
     * PATH A — user_id provided: link existing account, status=PENDING (needs e-signature).
     * PATH B — email provided (no user_id): look up account by email;
     *          found → link + notify via socket; not found → create UserInvitation + send email.
     * PATH C — no user_id, no email: manual declaration (manager vouches), status=APPROVED.
     */
    public function addMember(Contract $contract, array $memberData, ?User $performer = null): ContractMember
    {
        $identityFrontMediaUuid = $memberData['identity_front_media_id'] ?? null;
        $identityBackMediaUuid = $memberData['identity_back_media_id'] ?? null;
        unset($memberData['identity_front_media_id'], $memberData['identity_back_media_id']);

        $resolvedUser = null;
        $defaultStatus = 'APPROVED'; // PATH C baseline

        // ── PATH A: user_id provided ──────────────────────────────────────────
        if (! empty($memberData['user_id'])) {
            $resolvedUser = User::find($memberData['user_id']);
            if (! $resolvedUser) {
                throw new \InvalidArgumentException('Không tìm thấy tài khoản cư dân.');
            }
            $defaultStatus = 'PENDING';
        }
        // ── PATH B: email provided, no user_id ───────────────────────────────
        elseif (! empty($memberData['email'])) {
            $resolvedUser = User::where('email', $memberData['email'])->first();

            if ($resolvedUser) {
                // Account exists → link and require signature
                $memberData['user_id'] = $resolvedUser->id;
                $defaultStatus = 'PENDING';
            } else {
                // Account does not exist → create a UserInvitation
                $defaultStatus = 'PENDING_INVITE';

                if ($performer) {
                    /** @var UserInvitationService $invitationService */
                    $invitationService = app(UserInvitationService::class);

                    $invitationService->createContractInvite(
                        inviter: $performer,
                        email: $memberData['email'],
                        contract: $contract,
                        memberData: $memberData,
                    );
                }
            }
        }
        // ── PATH C: no user_id, no email → manual declaration ─────────────────
        // $defaultStatus is already 'APPROVED'

        // Merge user profile into snapshot (PATH A or B with existing user)
        if ($resolvedUser) {
            $memberData['full_name'] = $memberData['full_name'] ?? $resolvedUser->full_name;
            $memberData['phone'] = $memberData['phone'] ?? $resolvedUser->phone;
            $memberData['identity_number'] = $memberData['identity_number'] ?? $resolvedUser->identity_number;
            $memberData['date_of_birth'] = $memberData['date_of_birth'] ?? $resolvedUser->date_of_birth;
            $memberData['license_plate'] = $memberData['license_plate'] ?? $resolvedUser->license_plate;
        }

        $memberData['status'] ??= $defaultStatus;

        // Cư dân tự khai báo (PATH C): luôn chờ BQL duyệt, không auto-APPROVED như quản lý khai báo tay.
        if ($performer && $performer->hasRole('Tenant') && ($memberData['status'] ?? '') === 'APPROVED') {
            $memberData['status'] = 'PENDING';
        }

        // Date handling
        $joinedAt = null;
        $signedAt = null;
        if ($memberData['status'] === 'APPROVED') {
            $joinedAt = $memberData['joined_at'] ?? now();
            if ($this->contractMembersHasSignedAtColumn()) {
                $signedAt = $memberData['signed_at'] ?? now();
            }
        }

        $payload = array_merge(
            $memberData,
            [
                'contract_id' => $contract->id,
                'org_id' => $contract->org_id,
                'joined_at' => $joinedAt,
            ]
        );

        if ($this->contractMembersHasSignedAtColumn()) {
            $payload['signed_at'] = $signedAt;
        }

        $member = ContractMember::create($payload);

        $this->syncMemberIdentityFromTemporaryMedia($member, $identityFrontMediaUuid, $identityBackMediaUuid);

        // Fire real-time notification for PATH A/B (existing user linked)
        if ($resolvedUser && in_array($member->status, ['PENDING'])) {
            $resolvedUser->notify(
                new ContractSignatureRequested($contract, $member)
            );
        }

        // Regenerate soft copy if a document has already been generated.
        $this->regenerateDocumentIfExists($contract);

        return $member->fresh(['user', 'media']);
    }

    /**
     * Gắn ảnh CCCD từ bản ghi Media đang thuộc TemporaryUpload (upload tạm).
     */
    public function syncMemberIdentityFromTemporaryMedia(
        ContractMember $member,
        ?string $identityFrontMediaUuid,
        ?string $identityBackMediaUuid,
    ): void {
        if ($identityFrontMediaUuid) {
            $member->clearMediaCollection('identity_front');
            $member->syncMediaAttachments([$identityFrontMediaUuid], 'identity_front');
        }
        if ($identityBackMediaUuid) {
            $member->clearMediaCollection('identity_back');
            $member->syncMediaAttachments([$identityBackMediaUuid], 'identity_back');
        }
    }

    public function updateMember(string $contractId, string $memberId, array $data): ?ContractMember
    {
        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) {
            return null;
        }

        $identityFrontMediaUuid = $data['identity_front_media_id'] ?? null;
        $identityBackMediaUuid = $data['identity_back_media_id'] ?? null;
        unset($data['identity_front_media_id'], $data['identity_back_media_id']);

        if ($data !== []) {
            $member->update($data);
        }

        if ($identityFrontMediaUuid || $identityBackMediaUuid) {
            $this->syncMemberIdentityFromTemporaryMedia($member, $identityFrontMediaUuid, $identityBackMediaUuid);
        }

        // Regenerate soft copy if a document has already been generated.
        $contract = $member->contract;
        if ($contract) {
            $this->regenerateDocumentIfExists($contract);
        }

        return $member->refresh();
    }

    public function removeMember(string $contractId, string $memberId): bool
    {
        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) {
            return false;
        }

        return $member->update(['left_at' => now()]);
    }

    public function approveMember(string $contractId, string $memberId): ?ContractMember
    {
        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member || $member->status === 'APPROVED') {
            return null;
        }

        $member->update([
            'status' => 'APPROVED',
            'joined_at' => now(),
        ]);

        return $member->refresh();
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  INITIAL INVOICE (Hóa đơn ban đầu khi ký hợp đồng)
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Tạo hóa đơn ban đầu khi Tenant xác nhận hợp đồng.
     *
     * Bao gồm:
     * - Tiền phòng tháng đầu tiên (RENT)
     * - Tiền đặt cọc (DEPOSIT) – nếu > 0
     *
     * Invoice được tạo và tự động phát hành (ISSUED).
     */
    public function createInitialInvoice(Contract $contract, User $tenant): Invoice
    {
        $periodStart = Carbon::parse($contract->start_date);

        // Next billing date is usually 1 cycle after start_date
        $monthsToAdd = $this->resolveBillingCycleMonths($contract->billing_cycle);

        $nextBillingDate = $periodStart->copy()->addMonths($monthsToAdd);

        $periodEnd = $periodStart->copy()->addMonths($monthsToAdd)->subDay();
        $dueDate = now()->addDays(3);

        $baseRent = (float) $contract->base_rent;
        $depositAmount = (float) $contract->deposit_amount;

        $desc = $monthsToAdd === 1
            ? 'Tiền phòng tháng đầu tiên'
            : 'Tiền phòng chu kỳ '.$monthsToAdd.' tháng đầu tiên';

        // Xây dựng danh sách items
        $items = [
            [
                'type' => InvoiceItemType::RENT->value,
                'description' => $desc,
                'quantity' => $monthsToAdd,
                'unit_price' => $baseRent,
                'amount' => $baseRent * $monthsToAdd,
            ],
        ];

        // Add rent tokens for future months covered by this initial payment
        if ($monthsToAdd > 1) {
            $contract->increment('rent_token_balance', $monthsToAdd - 1);
        }

        // Thêm các dịch vụ cố định (fixed services)
        $roomServices = $this->serviceService->getRoomServices($contract->room_id, $contract->org_id);
        foreach ($roomServices as $rs) {
            if ($rs->service->calc_mode !== 'PER_METER') {
                $itemAmount = (float) ($rs->service->current_price * $rs->quantity);
                $items[] = [
                    'type' => InvoiceItemType::SERVICE->value,
                    'description' => "Phí dịch vụ: {$rs->service->name}",
                    'quantity' => $rs->quantity,
                    'unit_price' => (float) $rs->service->current_price,
                    'amount' => $itemAmount,
                ];
            }
        }

        if ($depositAmount > 0) {
            $items[] = [
                'type' => InvoiceItemType::DEPOSIT->value,
                'description' => 'Tiền đặt cọc',
                'quantity' => 1,
                'unit_price' => $depositAmount,
                'amount' => $depositAmount,
            ];
        }

        return $this->invoiceService->createInitialInvoice(
            invoiceData: [
                'org_id' => $contract->org_id,
                'property_id' => $contract->property_id,
                'contract_id' => $contract->id,
                'room_id' => $contract->room_id,
                'period_start' => $periodStart->format('Y-m-d'),
                'period_end' => $periodEnd->format('Y-m-d'),
                'due_date' => $dueDate->format('Y-m-d'),
                'snapshot' => ['is_initial' => true],
                'created_by_user_id' => $tenant->id,
            ],
            itemsData: $items,
        );
    }

    /**
     * Huỷ Initial Invoice khi contract bị cancel/delete ở PENDING_PAYMENT.
     *
     * Tìm invoice ban đầu (snapshot.is_initial = true) chưa PAID và cancel nó.
     */
    private function cancelInitialInvoice(Contract $contract): void
    {
        $initialInvoice = Invoice::where('contract_id', $contract->id)
            ->where(function ($q) {
                $q->whereJsonContains('snapshot->is_initial', true)
                    ->orWhere('snapshot', 'like', '%"is_initial":true%');
            })
            ->whereNotIn('status', ['PAID', 'CANCELLED'])
            ->first();

        if ($initialInvoice) {
            $this->invoiceService->cancelInvoice(
                $initialInvoice,
                'Tự động huỷ do hợp đồng bị huỷ/xóa.'
            );
        }
    }

    /**
     * Confirm Payment (Admin).
     *
     * Luồng:
     * 1. Xác nhận thanh toán hóa đơn ban đầu.
     * 2. Contract -> ACTIVE.
     * 3. Room -> occupied.
     */
    public function confirmPayment(Contract $contract, User $performer): bool
    {
        $allowedStatuses = array_map(fn ($enum) => $enum->value, ContractStatus::allowConfirmPayment());
        if (! in_array($contract->status, $allowedStatuses)) {
            throw new \Exception('Chỉ có thể xác nhận thanh toán cho hợp đồng đang chờ thanh toán.');
        }

        return DB::transaction(function () use ($contract) {
            // 1. Tìm Initial Invoice chưa PAID và mark PAID
            $initialInvoice = Invoice::where('contract_id', $contract->id)
                ->where(function ($q) {
                    $q->whereJsonContains('snapshot->is_initial', true)
                        ->orWhere('snapshot', 'like', '%"is_initial":true%');
                })
                ->whereNotIn('status', ['PAID', 'CANCELLED'])
                ->first();

            if ($initialInvoice) {
                // payInvoice gọi activateContractIfInitialInvoice() hook bên trong InvoiceService
                $this->invoiceService->payInvoice(
                    $initialInvoice,
                    'Xác nhận thanh toán bởi quản lý khi ký hợp đồng.'
                );
                $contract->refresh();
            }

            // 2. Đảm bảo contract ACTIVE (hook có thể đã set, hoặc không có initial invoice)
            if ($contract->status !== ContractStatus::ACTIVE) {
                $contract->update([
                    'status' => ContractStatus::ACTIVE,
                    'activated_at' => now(),
                ]);
            }

            // 3. Đảm bảo Room → occupied
            if ($contract->room) {
                $contract->room->update(['status' => 'occupied']);
            }

            return true;
        });
    }

    /**
     * Terminate Contract (Early Termination / Normal End).
     *
     * Params:
     * - termination_date (YYYY-MM-DD)
     * - cancellation_party (LANDLORD|TENANT|MUTUAL)
     * - cancellation_reason (string)
     * - waive_penalty (bool) — Manager chấp nhận miễn phạt cọc cho Tenant dời sớm
     * - refund_remaining_rent (bool)
     */
    /**
     * @return array{penalty_amount: float, penalty_rule_id: ?string}
     */
    public function resolveTerminationPipelinePenalty(Contract $contract, array $data): array
    {
        $waivePenalty = (bool) ($data['waive_penalty'] ?? false);
        $cancellationParty = $data['cancellation_party'] ?? null;
        $depositAmount = (float) $contract->deposit_amount;

        $terminationDate = $data['termination_date'] ?? now()->toDateString();
        $scheduledEndStr = $data['_scheduled_end_date']
            ?? ($contract->meta['termination_details']['scheduled_end_date'] ?? null);
        if ($scheduledEndStr === null && $contract->end_date) {
            $scheduledEndStr = $contract->end_date->format('Y-m-d');
        }

        $isEarlyTermination = $scheduledEndStr !== null
            && Carbon::parse($terminationDate)->startOfDay()->lt(Carbon::parse($scheduledEndStr)->startOfDay());

        $penaltyAmount = 0.0;
        $penaltyRuleId = null;

        if ($isEarlyTermination && ($cancellationParty === 'TENANT' || $cancellationParty === 'SYSTEM') && ! $waivePenalty) {
            $rule = PenaltyRule::active()
                ->where('type', PenaltyRuleType::EARLY_TERMINATION)
                ->where(function ($q) use ($contract) {
                    $q->where('property_id', $contract->property_id)
                        ->orWhereNull('property_id');
                })
                ->orderByDesc('property_id')
                ->first();

            if ($rule) {
                $penaltyAmount = (float) $rule->calculate((float) $contract->rent_price, $depositAmount);
                $penaltyRuleId = $rule->id;
            } else {
                $penaltyAmount = $depositAmount;
                $penaltyRuleId = 'default';
            }
        }

        return [
            'penalty_amount' => $penaltyAmount,
            'penalty_rule_id' => $penaltyRuleId,
        ];
    }

    public function terminate(Contract $contract, array $data): Invoice
    {
        $allowedStatuses = array_map(
            fn ($e) => $e instanceof \BackedEnum ? $e->value : (string) $e,
            ContractStatus::allowTerminate()
        );

        $currentStatus = $contract->status instanceof \BackedEnum
            ? $contract->status->value
            : (string) $contract->status;

        if (! in_array($currentStatus, $allowedStatuses)) {
            throw new \Exception('Chỉ có thể thanh lý hợp đồng đang hoạt động, chờ thanh lý hoặc hết hạn.');
        }

        $skipMeterReadinessGuard = (bool) ($data['skip_meter_readiness_guard'] ?? false);

        if (! $skipMeterReadinessGuard) {
            $terminationDateCheck = $data['termination_date'] ?? now()->toDateString();
            $unreadMeters = $this->getMetersWithoutApprovedReading($contract->room_id, $terminationDateCheck);
            if ($unreadMeters->isNotEmpty()) {
                $labels = $unreadMeters->pluck('code')->join(', ');
                throw new \Exception(
                    "Chưa chốt số đồng hồ: [{$labels}]. Vui lòng ghi nhận và duyệt chỉ số trước khi thanh lý hợp đồng."
                );
            }
        }

        return app(ContractTerminationPipelineService::class)->run($contract, $data);
    }

    /**
     * Tenant gửi thông báo trả phòng (ngày dự kiến dọn đi + lý do).
     *
     * Contract chuyển sang PENDING_TERMINATION, ghi lại thời điểm báo và ngày dự kiến dọn.
     *
     * @return array{is_early_termination: bool, warnings: list<string>, contract: Contract}
     */
    public function requestTermination(Contract $contract, User $requester, array $data): array
    {
        $allowedStatuses = array_map(
            fn ($e) => $e instanceof \BackedEnum ? $e->value : (string) $e,
            ContractStatus::allowRequestTermination()
        );

        $currentStatus = $contract->status instanceof \BackedEnum
            ? $contract->status->value
            : (string) $contract->status;

        if (! in_array($currentStatus, $allowedStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => ['Chỉ có thể gửi thông báo trả phòng khi hợp đồng đang hiệu lực.'],
            ]);
        }

        $tz = config('app.timezone');
        $expected = Carbon::parse($data['expected_move_out_date'], $tz)->startOfDay();
        $end = $contract->end_date
            ? Carbon::parse($contract->end_date)->copy()->timezone($tz)->startOfDay()
            : null;

        $isEarlyTermination = $end !== null && $expected->lt($end);
        $warnings = [];
        if ($isEarlyTermination) {
            $warnings[] = 'Việc trả phòng trước hạn có thể làm mất tiền cọc hoặc phát sinh phí phạt theo điều khoản hợp đồng. Quản lý sẽ liên hệ để chốt chi phí.';
        }

        DB::transaction(function () use ($contract, $data, $expected) {
            $contract->update([
                'status' => ContractStatus::PENDING_TERMINATION,
                'notice_given_at' => now(),
                'expected_move_out_date' => $expected->toDateString(),
                'cancellation_party' => ContractCancellationParty::TENANT->value,
                'cancellation_reason' => $data['reason'] ?? null,
            ]);
        });

        $contract->refresh();

        return [
            'is_early_termination' => $isEarlyTermination,
            'warnings' => $warnings,
            'contract' => $contract,
        ];
    }

    /**
     * Dòng phụ thu chênh lệch tiền phòng khi chuyển phòng sang phòng mới đắt hơn.
     * Pro-rate theo số ngày còn lại của tháng kể từ ngày chuyển.
     * Chỉ phát sinh dòng dương (phòng mới đắt hơn); phòng mới rẻ hơn → không tạo dòng.
     *
     * @return array<int, array{description: string, amount: float}>
     */
    private function buildRoomTransferRentDeltaInvoiceLines(
        Carbon $transferDate,
        float $oldRentPrice,
        float $newRentPrice,
        ?string $oldRoomLabel = null,
    ): array {
        $deltaMonthly = round($newRentPrice - $oldRentPrice, 2);
        if ($deltaMonthly <= 0.01) {
            return [];
        }

        $daysInMonth = (int) $transferDate->daysInMonth;
        $daysRemaining = $daysInMonth - (int) $transferDate->day + 1;
        if ($daysRemaining < 1) {
            return [];
        }

        $amount = round($deltaMonthly * ($daysRemaining / $daysInMonth), 0);
        if ($amount < 1) {
            return [];
        }

        $suffix = $oldRoomLabel ? " (HĐ phòng {$oldRoomLabel})" : '';

        return [[
            'description' => "Phụ thu chênh lệch tiền phòng (phòng mới cao hơn), {$daysRemaining}/{$daysInMonth} ngày từ ngày chuyển{$suffix}.",
            'amount' => (float) $amount,
        ]];
    }

    /**
     * Số hóa đơn còn dư nợ của hợp đồng (trừ một hóa đơn — dùng khi execute sau bước phát hành HĐ chuyển phòng).
     */
    private function countOutstandingInvoicesForContractExcluding(?string $contractId, ?string $excludeInvoiceId = null): int
    {
        if (! $contractId) {
            return 0;
        }

        $query = Invoice::query()
            ->where('contract_id', $contractId)
            ->whereIn('status', ['ISSUED', 'LATE', 'PARTIAL', 'OVERDUE'])
            ->whereRaw('(total_amount - COALESCE(paid_amount, 0)) > 0.009');

        if ($excludeInvoiceId) {
            $query->where('id', '!=', $excludeInvoiceId);
        }

        return $query->count();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildRoomTransferFinalInvoiceItems(
        Contract $oldContract,
        string $transferDateStr,
        string $targetRoomId,
        float $resolvedNewRent,
        Carbon $transferDate,
    ): array {
        $oldRoomId = $oldContract->room_id;
        $items = [];

        $meters = Meter::where('room_id', $oldRoomId)
            ->where('is_active', true)
            ->get();

        foreach ($meters as $meter) {
            $usageData = $this->calculateTerminationMeterCost(
                $meter,
                $transferDateStr,
                $oldRoomId,
                $oldContract->org_id,
            );

            if (! $usageData) {
                continue;
            }

            $items[] = [
                'type' => InvoiceItemType::SERVICE->value,
                'description' => MeterInvoiceDescription::forUsage(
                    (string) $usageData['service_name'],
                    $meter->type,
                    $usageData['usage'],
                )." (chuyển phòng) — kỳ {$usageData['period_start']} → {$usageData['period_end']}",
                'quantity' => $usageData['usage'],
                'unit_price' => $usageData['average_price'],
                'amount' => $usageData['total_amount'],
                'meta' => [
                    'meter_id' => $meter->id,
                    'meter_code' => $meter->code,
                    'reading_id' => $usageData['reading_id'],
                    'prev_reading' => $usageData['prev_reading'],
                    'curr_reading' => $usageData['curr_reading'],
                    'tiers' => $usageData['tiers_breakdown'],
                    'is_room_transfer_reading' => true,
                ],
            ];
        }

        $deltaLines = $this->buildRoomTransferRentDeltaInvoiceLines(
            $transferDate,
            (float) $oldContract->rent_price,
            $resolvedNewRent,
            $oldContract->room?->code ?? $oldContract->room?->name,
        );

        foreach ($deltaLines as $line) {
            $items[] = [
                'type' => InvoiceItemType::ADJUSTMENT->value,
                'description' => $line['description'],
                'quantity' => 1,
                'unit_price' => $line['amount'],
                'amount' => $line['amount'],
                'meta' => ['source' => 'room_transfer_rent_delta'],
            ];
        }

        return $items;
    }

    private function resolveRoomTransferNewRent(Contract $oldContract, Room $targetRoom, array $data): float
    {
        $resolvedNewRent = $data['rent_price'] ?? null;
        if ($resolvedNewRent === null || $resolvedNewRent === '') {
            return (float) ($targetRoom->base_price ?? 0) > 0
                ? (float) $targetRoom->base_price
                : (float) $oldContract->rent_price;
        }

        return (float) $resolvedNewRent;
    }

    private function assertLinkedRoomTransferInvoiceMatches(
        Invoice $linked,
        Contract $oldContract,
        string $transferDateStr,
        string $targetRoomId,
        float $resolvedNewRent,
        array $items,
    ): void {
        if ((string) $linked->contract_id !== (string) $oldContract->id) {
            abort(422, 'Hóa đơn liên kết không thuộc hợp đồng này.');
        }

        $snap = $linked->snapshot;
        if (! is_array($snap)) {
            abort(422, 'Hóa đơn liên kết không hợp lệ.');
        }

        if (($snap['source'] ?? null) !== 'room_transfer') {
            abort(422, 'Hóa đơn liên kết không phải hóa đơn chuyển phòng.');
        }

        if ((string) ($snap['target_room_id'] ?? '') !== (string) $targetRoomId) {
            abort(422, 'Hóa đơn liên kết không khớp phòng đích đã chọn.');
        }

        if (($snap['transfer_date'] ?? '') !== $transferDateStr) {
            abort(422, 'Hóa đơn liên kết không khớp ngày chuyển.');
        }

        if (abs((float) ($snap['new_rent_price'] ?? 0) - $resolvedNewRent) > 0.02) {
            abort(422, 'Hóa đơn liên kết không khớp giá thuê mới.');
        }

        if (abs((float) ($snap['old_rent_price'] ?? 0) - (float) $oldContract->rent_price) > 0.02) {
            abort(422, 'Hóa đơn liên kết không khớp giá thuê cũ.');
        }

        $allowedStatuses = ['ISSUED', 'PARTIAL', 'LATE', 'OVERDUE', 'PAID'];
        if (! in_array((string) $linked->status, $allowedStatuses, true)) {
            abort(422, 'Trạng thái hóa đơn liên kết không hợp lệ để hoàn tất chuyển phòng.');
        }

        $sumItems = round(array_sum(array_map(fn ($row) => (float) ($row['amount'] ?? 0), $items)), 2);
        $total = round((float) $linked->total_amount, 2);
        if (abs($sumItems - $total) > 5.0) {
            abort(422, 'Hóa đơn liên kết không khớp khoản phát sinh hiện tại (tổng tiền thay đổi — hãy phát hành lại hóa đơn sau khi chốt chỉ số).');
        }
    }

    /**
     * Xem trước chuyển phòng (read-only): đồng hồ, nợ, dòng HĐ dự kiến.
     *
     * @return array<string, mixed>
     */
    public function previewRoomTransfer(Contract $oldContract, array $data): array
    {
        if ($oldContract->status !== ContractStatus::ACTIVE) {
            abort(422, 'Chỉ có thể xem trước chuyển phòng khi hợp đồng đang hiệu lực.');
        }

        $transferDate = Carbon::parse($data['transfer_date']);
        $transferDateStr = $transferDate->toDateString();
        $targetRoomId = $data['target_room_id'];
        $oldRoomId = $oldContract->room_id;

        $targetRoom = Room::query()
            ->whereKey($targetRoomId)
            ->where('property_id', $oldContract->property_id)
            ->where('status', 'available')
            ->first();

        if (! $targetRoom) {
            abort(422, 'Phòng đích không hợp lệ hoặc không còn trống trong cùng cơ sở.');
        }

        $resolvedNewRent = $this->resolveRoomTransferNewRent($oldContract, $targetRoom, $data);

        $oldContract->loadMissing(['room']);

        $unreadMeters = $this->getMetersWithoutApprovedReading($oldRoomId, $transferDateStr);
        $outstandingCount = $this->countOutstandingInvoicesForContractExcluding($oldContract->id, null);

        $items = $this->buildRoomTransferFinalInvoiceItems(
            $oldContract,
            $transferDateStr,
            $targetRoomId,
            $resolvedNewRent,
            $transferDate,
        );

        $linePreview = array_map(fn ($row) => [
            'description' => (string) ($row['description'] ?? ''),
            'amount' => (float) ($row['amount'] ?? 0),
            'type' => (string) ($row['type'] ?? ''),
        ], $items);

        return [
            'transfer_date' => $transferDateStr,
            'target_room_id' => $targetRoomId,
            'resolved_new_rent' => $resolvedNewRent,
            'meters_sealed' => $unreadMeters->isEmpty(),
            'unread_meter_codes' => $unreadMeters->pluck('code')->filter()->values()->all(),
            'outstanding_invoice_count' => $outstandingCount,
            'has_invoice_lines' => count($items) > 0,
            'line_preview' => $linePreview,
            'estimated_invoice_total' => round(array_sum(array_column($linePreview, 'amount')), 2),
        ];
    }

    /**
     * Phát hành hóa đơn cuối cho HĐ cũ (điện/nước + chênh lệch tiền phòng nếu có).
     * Trả về null nếu không có dòng nào.
     */
    public function issueRoomTransferFinalInvoice(Contract $oldContract, array $data, User $performer): ?Invoice
    {
        if ($oldContract->status !== ContractStatus::ACTIVE) {
            abort(422, 'Chỉ có thể phát hành hóa đơn chuyển phòng khi hợp đồng đang hiệu lực.');
        }

        return DB::transaction(function () use ($oldContract, $data, $performer) {
            $transferDate = Carbon::parse($data['transfer_date']);
            $transferDateStr = $transferDate->toDateString();
            $targetRoomId = $data['target_room_id'];
            $oldRoomId = $oldContract->room_id;

            $targetRoom = Room::query()
                ->whereKey($targetRoomId)
                ->where('property_id', $oldContract->property_id)
                ->where('status', 'available')
                ->first();

            if (! $targetRoom) {
                abort(422, 'Phòng đích không hợp lệ hoặc không còn trống trong cùng cơ sở.');
            }

            $unreadMeters = $this->getMetersWithoutApprovedReading($oldRoomId, $transferDateStr);
            if ($unreadMeters->isNotEmpty()) {
                $labels = $unreadMeters->pluck('code')->join(', ');
                abort(422, "Chưa chốt số đồng hồ phòng hiện tại: [{$labels}]. Vui lòng ghi nhận và duyệt chỉ số đến ngày chuyển trước khi phát hành hóa đơn.");
            }

            $outstandingCount = $this->countOutstandingInvoicesForContractExcluding($oldContract->id, null);
            if ($outstandingCount > 0) {
                abort(422, "Hợp đồng còn {$outstandingCount} hóa đơn chưa thanh toán. Vui lòng thu hết nợ cũ trước khi phát hành hóa đơn chuyển phòng.");
            }

            $resolvedNewRent = $this->resolveRoomTransferNewRent($oldContract, $targetRoom, $data);

            $oldContract->loadMissing(['room']);

            $items = $this->buildRoomTransferFinalInvoiceItems(
                $oldContract,
                $transferDateStr,
                $targetRoomId,
                $resolvedNewRent,
                $transferDate,
            );

            if (count($items) === 0) {
                return null;
            }

            $invoice = $this->invoiceService->create([
                'org_id' => $oldContract->org_id,
                'property_id' => $oldContract->property_id,
                'room_id' => $oldRoomId,
                'contract_id' => $oldContract->id,
                'status' => 'DRAFT',
                'issue_date' => $transferDateStr,
                'due_date' => $transferDate->copy()->addDays(3)->toDateString(),
                'period_start' => $transferDateStr,
                'period_end' => $transferDateStr,
                'is_termination' => false,
                'snapshot' => [
                    'source' => 'room_transfer',
                    'target_room_id' => $targetRoomId,
                    'transfer_date' => $transferDateStr,
                    'old_rent_price' => (float) $oldContract->rent_price,
                    'new_rent_price' => $resolvedNewRent,
                ],
            ], $items);

            $this->invoiceService->issueInvoice(
                $invoice,
                $performer->id,
                'Hóa đơn chuyển phòng (điện/nước phòng cũ + chênh lệch nếu có).'
            );

            return $invoice->refresh();
        });
    }

    /**
     * Thực hiện chuyển phòng (Execute Room Transfer) — luồng đơn giản, KHÔNG đi qua pipeline thanh lý.
     *
     * Quy trình:
     * 1. Guard chốt đồng hồ phòng cũ.
     * 2. Guard nợ hóa đơn cũ chưa thanh toán (trừ hóa đơn chuyển phòng đã liên kết nếu có).
     * 3. Nếu có dòng phát sinh: bắt buộc linked_transfer_invoice_id khớp bước phát hành; nếu không có dòng thì không gửi liên kết.
     * 4. Đóng HĐ cũ thẳng → TERMINATED (không dispatch event termination, không tạo handover).
     * 5. Tạo HĐ mới ACTIVE, kế thừa nguyên xi tiền cọc; không tạo hóa đơn đầu kỳ cho HĐ mới.
     * 6. Nếu có HĐ chuyển phòng: cập nhật invoices.contract_id / room_id → HĐ mới & phòng mới (snapshot giữ id HĐ/phòng cũ).
     */
    public function executeTransfer(Contract $oldContract, array $data, User $performer): Contract
    {
        if ($oldContract->status !== ContractStatus::ACTIVE) {
            abort(422, 'Chỉ có thể chuyển phòng khi hợp đồng đang hiệu lực.');
        }

        return DB::transaction(function () use ($oldContract, $data, $performer) {
            $transferDate = Carbon::parse($data['transfer_date']);
            $transferDateStr = $transferDate->toDateString();
            $targetRoomId = $data['target_room_id'];
            $oldRoomId = $oldContract->room_id;
            $linkedInvoiceId = $data['linked_transfer_invoice_id'] ?? null;

            $targetRoom = Room::query()
                ->whereKey($targetRoomId)
                ->where('property_id', $oldContract->property_id)
                ->where('status', 'available')
                ->first();

            if (! $targetRoom) {
                abort(422, 'Phòng đích không hợp lệ hoặc không còn trống trong cùng cơ sở.');
            }

            // Guard 1 — chốt đồng hồ phòng cũ đến ngày chuyển.
            $unreadMeters = $this->getMetersWithoutApprovedReading($oldRoomId, $transferDateStr);
            if ($unreadMeters->isNotEmpty()) {
                $labels = $unreadMeters->pluck('code')->join(', ');
                abort(422, "Chưa chốt số đồng hồ phòng hiện tại: [{$labels}]. Vui lòng ghi nhận và duyệt chỉ số đến ngày chuyển trước khi chuyển phòng.");
            }

            // Guard 2 — chặn khi HĐ còn hóa đơn chưa thanh toán (trừ HĐ chuyển phòng đã liên kết).
            $outstandingCount = $this->countOutstandingInvoicesForContractExcluding($oldContract->id, $linkedInvoiceId);
            if ($outstandingCount > 0) {
                abort(422, "Hợp đồng còn {$outstandingCount} hóa đơn chưa thanh toán. Vui lòng thu hết nợ cũ trước khi chuyển phòng.");
            }

            $resolvedNewRent = $this->resolveRoomTransferNewRent($oldContract, $targetRoom, $data);

            $oldContract->loadMissing(['members', 'room']);

            $items = $this->buildRoomTransferFinalInvoiceItems(
                $oldContract,
                $transferDateStr,
                $targetRoomId,
                $resolvedNewRent,
                $transferDate,
            );

            $invoiceId = null;

            if (count($items) > 0) {
                if (empty($linkedInvoiceId)) {
                    abort(422, 'Cần phát hành hóa đơn chuyển phòng trước (POST /contracts/{id}/transfer/issue-final-invoice), sau đó gửi linked_transfer_invoice_id khi xác nhận chuyển phòng.');
                }

                $linked = Invoice::query()->whereKey($linkedInvoiceId)->lockForUpdate()->firstOrFail();
                $this->assertLinkedRoomTransferInvoiceMatches(
                    $linked,
                    $oldContract,
                    $transferDateStr,
                    $targetRoomId,
                    $resolvedNewRent,
                    $items,
                );
                $invoiceId = $linked->id;
            } elseif (! empty($linkedInvoiceId)) {
                abort(422, 'Không có dòng thanh toán cho chuyển phòng — không gửi linked_transfer_invoice_id.');
            }

            // Đóng HĐ cũ trực tiếp về TERMINATED — KHÔNG dispatch event termination/handover.
            $oldContract->update([
                'status' => ContractStatus::TERMINATED,
                'end_date' => $transferDateStr,
                'terminated_at' => now(),
                'cancellation_party' => ContractCancellationParty::MUTUAL,
                'cancellation_reason' => 'Chuyển sang phòng mới (ID: '.$targetRoomId.').',
                'meta' => array_merge($oldContract->meta ?? [], [
                    'room_transfer' => [
                        'to_room_id' => $targetRoomId,
                        'transfer_date' => $transferDateStr,
                        'final_invoice_id' => $invoiceId,
                        'pipeline' => 'simple_transfer_v1',
                    ],
                ]),
            ]);

            // Tạo HĐ mới — kế thừa cọc + members.
            $newContractData = [
                'org_id' => $oldContract->org_id,
                'property_id' => $targetRoom->property_id,
                'room_id' => $targetRoomId,
                'start_date' => $transferDateStr,
                'rent_price' => $resolvedNewRent,
                'deposit_amount' => isset($data['deposit_amount']) && $data['deposit_amount'] !== ''
                    ? (float) $data['deposit_amount']
                    : (float) $oldContract->deposit_amount,
                'deposit_months' => $oldContract->deposit_months,
                'deposit_status' => DepositStatus::HELD,
                'billing_cycle' => $oldContract->billing_cycle,
                'due_day' => $oldContract->due_day,
                'cutoff_day' => $oldContract->cutoff_day,
                'meta' => [
                    'deposit_inherited_from' => $oldContract->id,
                    'transfer_source_contract_id' => $oldContract->id,
                    'transfer_final_invoice_id' => $invoiceId,
                ],
            ];

            $membersData = [];
            foreach ($oldContract->members as $member) {
                $membersData[] = [
                    'user_id' => $member->user_id,
                    'is_primary' => $member->is_primary,
                    'status' => 'APPROVED',
                    'joined_at' => $transferDate->toDateTimeString(),
                ];
            }
            $newContractData['members'] = $membersData;

            $newContract = $this->create($newContractData, $performer);

            // ACTIVE thẳng — cọc đã có, không cần ký + không phát hành hóa đơn đầu kỳ.
            $newContract->update([
                'status' => ContractStatus::ACTIVE,
                'signed_at' => now(),
            ]);

            // ContractObserver chỉ tự free phòng khi contract → TERMINATED;
            // chiều ngược (set occupied) phải làm thủ công như các flow khác.
            $targetRoom->update(['status' => 'occupied']);

            // Gán hóa đơn chuyển phòng sang HĐ mới (và phòng mới) để danh sách hóa đơn theo HĐ hiện tại đúng nghiệp vụ thu.
            // Lưu mốc HĐ/phòng cũ trong snapshot để đối soát.
            if ($invoiceId !== null) {
                $transferInvoice = Invoice::query()->whereKey($invoiceId)->lockForUpdate()->first();
                if ($transferInvoice) {
                    $snap = is_array($transferInvoice->snapshot) ? $transferInvoice->snapshot : [];
                    $snap['transfer_invoice_original_contract_id'] = (string) $oldContract->id;
                    $snap['transfer_invoice_original_room_id'] = (string) $oldRoomId;
                    $transferInvoice->update([
                        'contract_id' => $newContract->id,
                        'room_id' => $targetRoomId,
                        'snapshot' => $snap,
                    ]);
                }
            }

            return $newContract->refresh();
        });
    }

    /**
     * Tự động đánh dấu các hợp đồng hết hạn nhưng chưa được thanh lý là EXPIRED.
     *
     * Dùng với Scheduler (chạy hàng ngày).
     */
    public function markExpiredContracts(): int
    {
        $contracts = Contract::where('status', 'ACTIVE')
            ->whereNotNull('end_date')
            ->where('end_date', '<', today())
            ->get();

        $count = 0;
        foreach ($contracts as $contract) {
            DB::transaction(function () use ($contract) {
                $contract->update(['status' => ContractStatus::EXPIRED]);

                // Nếu tiền cọc đang ở trạng thái HELD → chuyển sang REFUND_PENDING
                if ($contract->deposit_status?->value === 'HELD') {
                    $contract->update(['deposit_status' => DepositStatus::REFUND_PENDING]);
                }
            });
            $count++;
        }

        return $count;
    }

    /**
     * Tự động thanh lý các hợp đồng có dư nợ vượt quá tiền cọc.
     */
    public function processDebtBreachTerminations(): int
    {
        $contracts = Contract::where('status', ContractStatus::ACTIVE)
            ->where('deposit_amount', '>', 0)
            ->get();

        $count = 0;
        foreach ($contracts as $contract) {
            $unpaidBalance = $this->invoiceService->getUnpaidBalance($contract->id);
            $depositAmount = (float) $contract->deposit_amount;

            if ($unpaidBalance >= $depositAmount) {
                DB::transaction(function () use ($contract, $unpaidBalance) {
                    $this->terminate($contract, [
                        'termination_date' => now()->toDateString(),
                        'cancellation_party' => ContractCancellationParty::SYSTEM->value,
                        'reason' => "Tự động thanh lý: Dư nợ ({$unpaidBalance}) vượt quá tiền cọc ({$contract->deposit_amount}).",
                        'waive_penalty' => false,
                        'forfeit_deposit' => true,
                        'skip_meter_readiness_guard' => true,
                    ]);
                });
                $count++;
            }
        }

        return $count;
    }

    /**
     * Các dòng hóa đơn thanh lý cuối (EDA): tiền phòng + phí cố định tháng cuối (đủ tháng — BQL tự chỉnh dòng / điều chỉnh nếu cần), điện/nước, phí hư hỏng, phạt — không gom nợ cũ và không ghi hoàn cọc trên hóa đơn (cấn trừ FIFO ở Reconciliation).
     *
     * @param  array<string, mixed>  $data
     * @return array<int, array<string, mixed>>
     */
    public function buildTerminationPipelineInvoiceItems(
        Contract $contract,
        string $terminationDate,
        array $data,
    ): array {
        $items = [];

        $terminationDateObj = Carbon::parse($terminationDate);
        $periodStart = $terminationDateObj->copy()->startOfMonth();
        $fullRent = (float) $contract->rent_price;
        $fullFixedServices = (float) $contract->fixed_services_fee;

        $existingInvoice = Invoice::where('contract_id', $contract->id)
            ->where('period_start', $periodStart->toDateString())
            ->where('period_end', $periodStart->copy()->endOfMonth()->toDateString())
            ->whereIn('status', ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'])
            ->exists();

        // billing_mode:
        //   - 'combined' (default): nếu chưa có HĐ định kỳ tháng đó → thanh lý gộp rent + dịch vụ + điện/nước.
        //   - 'split': giả định HĐ định kỳ tháng cuối đã/sẽ phát hành riêng → HĐ thanh lý CHỈ chứa damage + penalty.
        $billingMode = ($data['billing_mode'] ?? 'combined') === 'split' ? 'split' : 'combined';
        $skipRecurringItems = $billingMode === 'split' || $existingInvoice;

        if (! $skipRecurringItems) {
            $items[] = [
                'type' => InvoiceItemType::RENT->value,
                'description' => 'Tiền thuê tháng cuối (theo giá hợp đồng — chỉnh sửa thủ công nếu cần)',
                'quantity' => 1,
                'unit_price' => $fullRent,
                'amount' => $fullRent,
                'meta' => [
                    'full_rent' => $fullRent,
                ],
            ];

            if ($fullFixedServices > 0.009) {
                $items[] = [
                    'type' => InvoiceItemType::SERVICE->value,
                    'description' => 'Phí dịch vụ cố định tháng cuối (theo hợp đồng — chỉnh sửa thủ công nếu cần)',
                    'quantity' => 1,
                    'unit_price' => $fullFixedServices,
                    'amount' => $fullFixedServices,
                    'meta' => [
                        'full_fixed_services_fee' => $fullFixedServices,
                    ],
                ];
            }

            $meters = Meter::where('room_id', $contract->room_id)
                ->where('is_active', true)
                ->get();

            foreach ($meters as $meter) {
                $usageData = $this->calculateTerminationMeterCost(
                    $meter,
                    $terminationDate,
                    $contract->room_id,
                    $contract->org_id,
                );

                if (! $usageData) {
                    continue;
                }

                $items[] = [
                    'type' => InvoiceItemType::SERVICE->value,
                    'description' => MeterInvoiceDescription::forUsage(
                        (string) $usageData['service_name'],
                        $meter->type,
                        $usageData['usage'],
                    )." tháng cuối — kỳ {$usageData['period_start']} → {$usageData['period_end']}",
                    'quantity' => $usageData['usage'],
                    'unit_price' => $usageData['average_price'],
                    'amount' => $usageData['total_amount'],
                    'meta' => [
                        'meter_id' => $meter->id,
                        'meter_code' => $meter->code,
                        'reading_id' => $usageData['reading_id'],
                        'prev_reading' => $usageData['prev_reading'],
                        'curr_reading' => $usageData['curr_reading'],
                        'tiers' => $usageData['tiers_breakdown'],
                        'is_termination_reading' => true,
                    ],
                ];
            }
        }

        $damageFee = (float) ($data['damage_fee_total'] ?? 0);
        if ($damageFee > 0) {
            $items[] = [
                'type' => InvoiceItemType::PENALTY->value,
                'description' => 'Phí hư hỏng / bồi thường tài sản (khi thanh lý)',
                'quantity' => 1,
                'unit_price' => $damageFee,
                'amount' => $damageFee,
                'meta' => ['source' => 'handover_damage'],
            ];
        }

        $penaltyAmount = (float) ($data['penalty_amount'] ?? 0);
        if ($penaltyAmount > 0) {
            $items[] = [
                'type' => InvoiceItemType::PENALTY->value,
                'description' => 'Phí vi phạm hợp đồng (dời trước hạn)',
                'quantity' => 1,
                'unit_price' => $penaltyAmount,
                'amount' => $penaltyAmount,
            ];
        }

        $midMonthCredit = round(max(0, (float) ($data['mid_month_rent_credit'] ?? 0)), 2);
        if ($midMonthCredit > 0.009 && ($existingInvoice || $billingMode === 'split')) {
            $items[] = [
                'type' => InvoiceItemType::DISCOUNT->value,
                'description' => 'Điều chỉnh giảm (đã thu cả tháng / trả phòng giữa kỳ — thỏa thuận)',
                'quantity' => 1,
                'unit_price' => -$midMonthCredit,
                'amount' => -$midMonthCredit,
                'meta' => ['source' => 'mid_month_rent_credit'],
            ];
        }

        return $items;
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  SETTLEMENT HELPERS
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Chỉ số đã chốt kỳ (khách đã trả / đã khóa sau phát hành HĐ định kỳ) chuyển sang LOCKED — vẫn hợp lệ cho thanh lý.
     *
     * @return array<int, string>
     */
    private function meterReadingStatusesEligibleForTermination(): array
    {
        return ['APPROVED', 'LOCKED'];
    }

    /**
     * Trả về các meters của phòng chưa có reading APPROVED/LOCKED tính đến terminationDate.
     * Dùng làm guard trước khi cho phép thanh lý.
     */
    private function getMetersWithoutApprovedReading(string $roomId, string $terminationDate): Collection
    {
        $meters = Meter::where('room_id', $roomId)
            ->where('is_active', true)
            ->get();

        return $meters->filter(function (Meter $meter) use ($terminationDate) {
            return ! MeterReading::where('meter_id', $meter->id)
                ->whereIn('status', $this->meterReadingStatusesEligibleForTermination())
                ->where('period_end', '<=', $terminationDate)
                ->exists();
        });
    }

    /**
     * Tính chi phí điện/nước cuối kỳ từ reading APPROVED hoặc LOCKED gần nhất.
     * LOCKED: chỉ số đã khóa sau kỳ thanh toán định kỳ — vẫn dùng được cho HĐ thanh lý.
     * Kế thừa logic tiered/flat từ RecurringBillingService::calculateMeterUsage().
     *
     * @return array|null null nếu không có reading phù hợp
     */
    public function calculateTerminationMeterCost(Meter $meter, string $terminationDate, ?string $roomId = null, ?string $orgId = null): ?array
    {
        $statuses = $this->meterReadingStatusesEligibleForTermination();

        // Reading gần nhất đã chốt (≤ terminationDate)
        $currentReading = MeterReading::where('meter_id', $meter->id)
            ->whereIn('status', $statuses)
            ->where('period_end', '<=', $terminationDate)
            ->orderBy('period_end', 'desc')
            ->first();

        if (! $currentReading) {
            return null;
        }

        // Reading trước đó để tính consumption
        $previousReading = MeterReading::where('meter_id', $meter->id)
            ->whereIn('status', $statuses)
            ->where('period_end', '<', $currentReading->period_end)
            ->orderBy('period_end', 'desc')
            ->first();

        $prevValue = $previousReading ? (float) $previousReading->reading_value : (float) $meter->base_reading;
        $currValue = (float) $currentReading->reading_value;
        $usage = max(0, $currValue - $prevValue);

        if ($usage <= 0) {
            return null;
        }

        // Resolve service (type-matched, room-scoped)
        $targetRoomId = $roomId ?? $meter->room_id;
        $targetOrgId = $orgId ?? $meter->org_id;

        $service = Service::where('type', $meter->type)
            ->where('org_id', $targetOrgId)
            ->whereHas('roomServices', fn ($q) => $q->where('room_id', $targetRoomId))
            ->first();

        if (! $service) {
            return null;
        }

        $currentRate = $service->currentRate;
        if (! $currentRate) {
            return null;
        }

        $currentRate->loadMissing('tieredRates');

        // ── Tính tiền: bậc thang hoặc flat ───────────────────────────────────
        $totalAmount = 0.0;
        $tiersBreakdown = [];

        if ($currentRate->tieredRates->count() > 0) {
            $remainingUsage = $usage;
            foreach ($currentRate->tieredRates as $tier) {
                $tierLimit = ($tier->tier_to === null) ? PHP_INT_MAX : ($tier->tier_to - $tier->tier_from);
                $amountInTier = min($remainingUsage, $tierLimit);

                if ($amountInTier > 0) {
                    $tierCost = $amountInTier * (float) $tier->price;
                    $totalAmount += $tierCost;
                    $tiersBreakdown[] = [
                        'tier' => "{$tier->tier_from}".($tier->tier_to ? " - {$tier->tier_to}" : '+'),
                        'usage' => $amountInTier,
                        'price' => (float) $tier->price,
                        'amount' => $tierCost,
                    ];
                    $remainingUsage -= $amountInTier;
                }

                if ($remainingUsage <= 0) {
                    break;
                }
            }
        } else {
            $totalAmount = $usage * (float) $currentRate->price;
        }

        return [
            'usage' => $usage,
            'prev_reading' => $prevValue,
            'curr_reading' => $currValue,
            'total_amount' => round($totalAmount, 0),
            'average_price' => $usage > 0 ? round($totalAmount / $usage, 2) : (float) $currentRate->price,
            'tiers_breakdown' => $tiersBreakdown,
            'service_name' => $service->name,
            'reading_id' => $currentReading->id,
            'period_start' => $currentReading->period_start,
            'period_end' => $currentReading->period_end,
        ];
    }

    public function checkOverlap(string $roomId, string $startDate, ?string $endDate = null, ?string $excludeContractId = null): ?Contract
    {
        $query = Contract::where('room_id', $roomId)
            ->whereIn('status', [
                ContractStatus::ACTIVE,
                ContractStatus::PENDING_SIGNATURE,
                ContractStatus::PENDING_PAYMENT,
            ]);

        if ($excludeContractId) {
            $query->where('id', '!=', $excludeContractId);
        }

        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->where('start_date', '<=', $endDate ?? '9999-12-31')
                ->where(function ($inner) use ($startDate) {
                    $inner->whereNull('end_date')
                        ->orWhere('end_date', '>=', $startDate);
                });
        })->first();
    }

    /**
     * Get availability status of a room based on current active contracts.
     */
    public function getRoomAvailabilityStatus(string $roomId): array
    {
        $activeContract = Contract::where('room_id', $roomId)
            ->whereIn('status', [ContractStatus::ACTIVE, ContractStatus::PENDING_SIGNATURE, ContractStatus::PENDING_PAYMENT])
            ->orderBy('end_date', 'desc')
            ->first();

        if (! $activeContract) {
            return ['status' => 'available'];
        }

        $now = now();
        $endDate = $activeContract->end_date ? Carbon::parse($activeContract->end_date) : null;

        if (! $endDate) {
            return [
                'status' => 'occupied',
                'contract_id' => $activeContract->id,
                'message' => 'Đang ở (Vô thời hạn)',
            ];
        }

        $daysLeft = (int) $now->diffInDays($endDate, false);

        if ($daysLeft < 0) {
            return ['status' => 'available'];
        }

        return [
            'status' => $daysLeft <= 30 ? 'expiring' : 'occupied',
            'days_left' => $daysLeft,
            'end_date' => $activeContract->end_date,
            'contract_id' => $activeContract->id,
            'message' => $daysLeft <= 30 ? "Sắp trống (còn {$daysLeft} ngày)" : "Đang ở (đến {$activeContract->end_date})",
        ];
    }

    private function generateJoinCode(): string
    {
        return strtoupper(Str::random(8));
    }

    private function allSignersApproved(Contract $contract): bool
    {
        // 1. Kiểm tra Manager đã ký chưa
        $managerSigned = ! empty($contract->meta['manager_signed_at']);
        if (! $managerSigned) {
            return false;
        }

        // 2. Kiểm tra tất cả các thành viên (Tenant) đã ký chưa
        return ! $contract->members()
            ->whereNull('left_at')
            ->where('status', '!=', 'APPROVED')
            ->exists();
    }

    /**
     * Silently regenerate the contract document if one already exists.
     * Used after member add/update so the soft copy stays in sync.
     */
    /**
     * Tạo lại file bản mềm khi đã có document_path (CLI, chỉnh sửa hợp đồng, v.v.).
     */
    public function regenerateDocumentIfExists(Contract $contract): void
    {
        if (! $contract->document_path) {
            return;
        }

        try {
            $fresh = $contract->fresh(['room', 'property', 'members.user', 'org', 'createdBy']);
            if (! $fresh) {
                return;
            }
            $docService = app(ContractDocumentService::class);
            $newPath = $docService->generateDocument($fresh);
            $ext = pathinfo($newPath, PATHINFO_EXTENSION);
            $contract->update([
                'document_path' => $newPath,
                'document_type' => $ext ? strtoupper($ext) : $contract->document_type,
            ]);
        } catch (\Throwable $e) {
            Log::warning('contract_document_regeneration_failed', [
                'contract_id' => $contract->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function hasInitialInvoice(Contract $contract): bool
    {
        return $contract->invoices()
            ->where('snapshot->is_initial', true)
            ->exists();
    }

    private function resolveBillingCycleMonths(string|int|null $billingCycle): int
    {
        return match ((string) $billingCycle) {
            'MONTHLY' => 1,
            'QUARTERLY' => 3,
            'SEMI_ANNUALLY' => 6,
            'YEARLY' => 12,
            default => max(1, (int) $billingCycle),
        };
    }

    private function normalizeBillingCycleValue(string|int|null $billingCycle): string
    {
        return (string) $this->resolveBillingCycleMonths($billingCycle);
    }

    private function ensureEndDateMeetsBillingCycle(
        ?string $startDate,
        ?string $endDate,
        string|int|null $billingCycle,
    ): void {
        if (! $startDate || ! $endDate) {
            return;
        }

        $minimumEndDate = Carbon::parse($startDate)
            ->addMonths($this->resolveBillingCycleMonths($billingCycle))
            ->toDateString();

        if (Carbon::parse($endDate)->lt(Carbon::parse($minimumEndDate))) {
            throw ValidationException::withMessages([
                'end_date' => "Ngay ket thuc khong duoc nho hon {$minimumEndDate} theo chu ky thue.",
            ]);
        }
    }

    private function contractMembersHasSignedAtColumn(): bool
    {
        if ($this->contractMembersHasSignedAtColumn === null) {
            $this->contractMembersHasSignedAtColumn = Schema::hasColumn('contract_members', 'signed_at');
        }

        return $this->contractMembersHasSignedAtColumn;
    }
}
