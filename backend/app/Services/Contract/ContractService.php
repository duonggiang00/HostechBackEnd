<?php

namespace App\Services\Contract;

use App\Enums\ContractStatus;
 use App\Enums\ContractCancellationParty;
 use App\Enums\DepositStatus;
 use App\Enums\InvoiceItemType;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Invoice\Invoice;
use App\Models\Org\User;
use App\Services\Invoice\InvoiceService;
use App\Services\Service\ServiceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
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
                $query->whereHas('members', fn($q) => $q->where('user_id', $user->id));
            } elseif ($user->hasRole(['Manager', 'Staff'])) {
                $query->whereHas('property.managers', fn($q) => $q->where('user_id', $user->id));
            } elseif (! $user->hasRole('Admin')) {
                $query->where('org_id', $user->org_id);
            }
        }

        $now = now()->toDateString();
        $in30 = now()->addDays(30)->toDateString();

        // Single query: all status counts + expiring (conditional aggregate)
        $row = $query
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as draft_count", [ContractStatus::DRAFT])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_sig_count", [ContractStatus::PENDING_SIGNATURE])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_pay_count", [ContractStatus::PENDING_PAYMENT])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active_count", [ContractStatus::ACTIVE])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as ended_count", [ContractStatus::ENDED])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled_count", [ContractStatus::CANCELLED])
            ->selectRaw("SUM(CASE WHEN status = ? AND end_date IS NOT NULL AND end_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as expiring_count", [ContractStatus::ACTIVE, $now, $in30])
            ->first();

        return [
            'total'             => (int) ($row->total ?? 0),
            'DRAFT'             => (int) ($row->draft_count ?? 0),
            'PENDING_SIGNATURE' => (int) ($row->pending_sig_count ?? 0),
            'PENDING_PAYMENT'   => (int) ($row->pending_pay_count ?? 0),
            'ACTIVE'            => (int) ($row->active_count ?? 0),
            'ENDED'             => (int) ($row->ended_count ?? 0),
            'CANCELLED'         => (int) ($row->cancelled_count ?? 0),
            'expiring'          => (int) ($row->expiring_count ?? 0),
        ];
    }

    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?User $user = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = QueryBuilder::for(Contract::class)
            ->allowedFilters(array_merge($allowedFilters, [
                AllowedFilter::exact('org_id'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('status'),
            ]))
            ->allowedSorts(['start_date', 'end_date', 'created_at', 'status', 'rent_price'])
            ->defaultSort('-created_at')
            ->with(['room', 'property', 'members.user']);

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

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?User $user = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
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
        return Contract::with(['room', 'property', 'members.user', 'createdBy', 'invoices'])->find($id);
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

            $property = $propertyId ? \App\Models\Property\Property::find($propertyId) : null;
            $room = $roomId ? \App\Models\Property\Room::find($roomId) : null;

            if ($property && $user?->org_id && $property->org_id !== $user->org_id) {
                throw ValidationException::withMessages([
                    'property_id' => 'Ban khong the tao hop dong ngoai to chuc hien tai.',
                ]);
            }

            if ($property && $room && $room->property_id !== $property->id) {
                throw ValidationException::withMessages([
                    'room_id' => 'Phong khong thuoc bat dong san da chon.',
                ]);
            }

            if ($room && $room->status === 'maintenance') {
                throw ValidationException::withMessages([
                    'room_id' => 'Phong dang bao tri, khong the tao hop dong moi.',
                ]);
            }

            // Check for overlap
            if ($roomId && $startDate) {
                $overlap = $this->checkOverlap($roomId, $startDate, $endDate);
                if ($overlap) {
                    $overlapDate = $overlap->start_date . ($overlap->end_date ? " - " . $overlap->end_date : " (Vo thoi han)");
                    throw ValidationException::withMessages([
                        'room_id' => "Phong nay da co hop dong trung lap trong khoang thoi gian nay ($overlapDate).",
                    ]);
                }
            }

            if ($property) {
                $contractData['billing_cycle'] = $this->normalizeBillingCycleValue(
                    $contractData['billing_cycle'] ?? $property->default_billing_cycle ?? 1
                );
                $contractData['due_day'] = $contractData['due_day'] ?? $property->default_due_day ?? 5;
                $contractData['cutoff_day'] = min(($contractData['cutoff_day'] ?? $property->default_cutoff_day ?? 25), 25);
                
                // If rent_price not provided, use Room's base_price or Property default
                if (empty($contractData['rent_price'])) {
                    $contractData['rent_price'] = $room->base_price ?? 0;
                }

                // If deposit_amount not provided, calculate based on property's default months
                if (empty($contractData['deposit_amount'])) {
                    $months = $property->default_deposit_months ?? 1;
                    $contractData['deposit_amount'] = (float) $contractData['rent_price'] * $months;
                }
            }
            // -------------------------------

            if ((float) ($contractData['rent_price'] ?? 0) <= 0) {
                throw ValidationException::withMessages([
                    'rent_price' => 'Gia thue phai lon hon 0 sau khi ap dung mac dinh cua phong/toa nha.',
                ]);
            }

            if (($contractData['cutoff_day'] ?? null) !== null
                && ($contractData['due_day'] ?? null) !== null
                && (int) $contractData['cutoff_day'] > (int) $contractData['due_day']) {
                throw ValidationException::withMessages([
                    'cutoff_day' => 'Ngay chot so khong duoc sau han nop.',
                ]);
            }

            $this->ensureEndDateMeetsBillingCycle(
                $contractData['start_date'] ?? null,
                $contractData['end_date'] ?? null,
                $contractData['billing_cycle'] ?? 1,
            );

            // --- FINANCIAL CALCULATION ---
            $rentPrice = (float) ($contractData['rent_price'] ?? 0);
            $contractData['base_rent'] = $rentPrice;

            $orgId = $contractData['org_id'];
            $fixedServicesFee = 0;

            if ($roomId) {
                $roomServices = $this->serviceService->getRoomServices($roomId, $orgId);
                foreach ($roomServices as $rs) {
                    // Only include fixed/recurring services (not metered)
                    if ($rs->service->calc_mode !== 'PER_METER') {
                        $fixedServicesFee += (float) ($rs->service->current_price * $rs->quantity);
                    }
                }
            }

            $contractData['fixed_services_fee'] = $fixedServicesFee;
            $contractData['total_rent'] = $rentPrice + $fixedServicesFee;

            // Calculate next_billing_date for the first time
            $startDate = \Carbon\Carbon::parse($contractData['start_date']);
            $monthsToAdd = $this->resolveBillingCycleMonths($contractData['billing_cycle'] ?? 1);
            $contractData['next_billing_date'] = $startDate->copy()->addMonths($monthsToAdd)->format('Y-m-d');
            // -----------------------------

            $contract = Contract::create($contractData);

            $hasPendingTenant = false;
            $primaryCount = collect($data['members'] ?? [])->where('is_primary', true)->count();

            if ($primaryCount !== 1) {
                throw ValidationException::withMessages([
                    'members' => 'Hop dong phai co dung 1 nguoi thue chinh.',
                ]);
            }

            if (isset($data['members']) && is_array($data['members'])) {
                foreach ($data['members'] as $memberData) {
                    // Member có user_id → Tenant cần ký → status PENDING
                    // Member không có user_id → khai báo thủ công → status APPROVED
                    $memberStatus = 'PENDING';

                    if ($memberStatus === 'PENDING') {
                        $hasPendingTenant = true;
                    }

                    $this->addMember($contract, array_merge($memberData, [
                        'status' => $memberData['status'] ?? $memberStatus,
                    ]), $user);
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
                    $overlapDate = $overlap->start_date . ($overlap->end_date ? " - " . $overlap->end_date : " (Vô thời hạn)");
                    throw new \Exception("Phòng này đã có hợp đồng trùng lặp trong khoảng thời gian này ($overlapDate).");
                }
            }

            if (array_key_exists('billing_cycle', $data)) {
                $data['billing_cycle'] = $this->normalizeBillingCycleValue($data['billing_cycle']);
            }

            if (array_key_exists('cutoff_day', $data)) {
                $data['cutoff_day'] = min((int) $data['cutoff_day'], 25);
            }

            if (array_key_exists('start_date', $data) || array_key_exists('billing_cycle', $data)) {
                $startDate = \Carbon\Carbon::parse($data['start_date'] ?? $contract->start_date);
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
        if ($contract) {
            return $contract->forceDelete();
        }

        return false;
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
        if (!$user) {
            abort(401, 'Unauthorized');
        }

        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            $base64Data = substr($base64Image, strpos($base64Image, ',') + 1);
            $type = strtolower($type[1]);
            
            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                abort(400, 'Định dạng ảnh chữ ký không hợp lệ');
            }
            
            $isManager = $user->hasRole(['Admin', 'Manager', 'Staff']);
            $rolePrefix = $isManager ? 'manager' : 'tenant';
            $signatureKey = $isManager ? 'signature_landlord' : 'signature_tenant';

            $imageName = 'signature_' . $rolePrefix . '_' . $contract->id . '-' . $user->id . '.' . $type;
            $storageFilePath = 'contracts/signatures/' . $imageName;
            \Illuminate\Support\Facades\Storage::disk('local')->put($storageFilePath, base64_decode($base64Data));
            $imagePath = \Illuminate\Support\Facades\Storage::disk('local')->path($storageFilePath);
            
            // Re-generate contract document to include the signature image
            $extraData = [$signatureKey => $imagePath];
            
            // Đọc chữ ký của bên còn lại nếu có để chèn đồng thời
            $otherRole = $isManager ? 'tenant' : 'manager';
            $otherKey = $isManager ? 'signature_tenant' : 'signature_landlord';
            $existingFiles = \Illuminate\Support\Facades\Storage::disk('local')->files('contracts/signatures');
            foreach ($existingFiles as $file) {
                if (str_starts_with(basename($file), 'signature_' . $otherRole . '_' . $contract->id . '-')) {
                    $extraData[$otherKey] = \Illuminate\Support\Facades\Storage::disk('local')->path($file);
                    break;
                }
            }

            $contractDocService = app(ContractDocumentService::class);
            $contractDocService->generateDocument($contract, $extraData);
            
            // Nếu người thuê ký thì mới gọi Accept Signature để xác nhận
            if (!$isManager) {
                $success = $this->acceptSignature($contract, $user);
                if (!$success) {
                    abort(403, 'Bạn không thể Ký do không nằm trong hợp đồng hoặc hợp đồng sai trạng thái.');
                }
            }
        } else {
            abort(400, 'Dữ liệu ảnh chữ ký không đúng định dạng');
        }
    }

    /**
     * Xác nhận ký hợp đồng (không có ảnh chữ ký mộc)
     */
    public function acceptSignature(Contract $contract, User $user): bool
    {
        $member = ContractMember::where('contract_id', $contract->id)
            ->where('user_id', $user->id)
            ->where('status', 'PENDING')
            ->first();

        if (! $member) {
            return false;
        }

        return DB::transaction(function () use ($contract, $member, $user) {
            // 1. Approve member
            $memberUpdateData = [
                'status' => 'APPROVED',
                'joined_at' => now(),
            ];

            if ($this->contractMembersHasSignedAtColumn()) {
                $memberUpdateData['signed_at'] = now();
            }

            $member->update($memberUpdateData);

            // 2. Tạo Initial Invoice (tiền phòng + cọc)
            if (in_array($contract->status, ContractStatus::allowAcceptSignature(), true) && $this->allSignersApproved($contract)) {
                if (! $this->hasInitialInvoice($contract)) {
                    $this->createInitialInvoice($contract, $user);
                }
                
                // 3. Contract → PENDING_PAYMENT
                $contract->update([
                    'status' => ContractStatus::PENDING_PAYMENT,
                    'signed_at' => now(),
                ]);
            }

            return true;
        });
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
     * Get available rooms for transfer within the same property
     */
    public function getAvailableRoomsForTransfer(Contract $contract): \Illuminate\Database\Eloquent\Collection
    {
        return \App\Models\Property\Room::where('property_id', $contract->property_id)
            ->where('status', 'available')
            ->where('id', '!=', $contract->room_id)
            ->select(['id', 'code', 'name', 'type', 'area', 'base_price', 'floor_number', 'capacity'])
            ->get();
    }

    /**
     * Request a room transfer
     */
    public function requestRoomTransfer(Contract $contract, User $user, array $data): bool
    {
        $targetRoom = \App\Models\Property\Room::where('id', $data['target_room_id'])
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

        return $contract->update([
            'meta' => array_merge($contract->meta ?? [], ['transfer_requests' => $transferRequests]),
        ]);
    }

    /**
     * General Add Member logic.
     * Status defaults to APPROVED for Managers, PENDING for others (Tenants).
     */
    public function addMember(Contract $contract, array $memberData, ?User $performer = null): ContractMember
    {
        // 1. Resolve User Details
        if (empty($memberData['user_id'])) {
            throw new \InvalidArgumentException('Chỉ được thêm cư dân đã có tài khoản vào hợp đồng.');
        }

        $user = User::find($memberData['user_id']);
        if (! $user) {
            throw new \InvalidArgumentException('Không tìm thấy tài khoản cư dân.');
        }

        $memberData['full_name'] = $memberData['full_name'] ?? $user->full_name;
        $memberData['phone'] = $memberData['phone'] ?? $user->phone;
        $memberData['identity_number'] = $memberData['identity_number'] ?? $user->identity_number;

        // 2. Intelligent Status Mapping
        if (! isset($memberData['status'])) {
            $memberData['status'] = 'PENDING';
        }

        // 3. Date Handling
        $joinedAt = null;
        $signedAt = null;
        if ($memberData['status'] === 'APPROVED') {
            $joinedAt = $memberData['joined_at'] ?? now();
            if ($this->contractMembersHasSignedAtColumn()) {
                $signedAt = $memberData['signed_at'] ?? now();
            }
        }

        $payload = array_merge($memberData, [
            'contract_id' => $contract->id,
            'org_id' => $contract->org_id,
            'joined_at' => $joinedAt,
        ]);

        if ($this->contractMembersHasSignedAtColumn()) {
            $payload['signed_at'] = $signedAt;
        }

        return ContractMember::create($payload);
    }

    public function updateMember(string $contractId, string $memberId, array $data): ?ContractMember
    {
        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) {
            return null;
        }

        $member->update($data);

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
        $periodStart = \Carbon\Carbon::parse($contract->start_date);
        
        // Next billing date is usually 1 cycle after start_date
        $monthsToAdd = $this->resolveBillingCycleMonths($contract->billing_cycle);
        
        $nextBillingDate = $periodStart->copy()->addMonths($monthsToAdd);

        $periodEnd = $periodStart->copy()->addMonths($monthsToAdd)->subDay();
        $dueDate = now()->addDays(3);

        $baseRent = (float) $contract->base_rent;
        $depositAmount = (float) $contract->deposit_amount;

        $desc = $monthsToAdd === 1 
            ? 'Tiền phòng tháng đầu tiên' 
            : 'Tiền phòng chu kỳ ' . $monthsToAdd . ' tháng đầu tiên';

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

        return DB::transaction(function () use ($contract, $performer) {
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
                    'status'       => ContractStatus::ACTIVE,
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
    public function terminate(Contract $contract, array $data): bool
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

        return DB::transaction(function () use ($contract, $data) {
            $terminationDate     = $data['termination_date'] ?? now()->toDateString();
            $cancellationParty   = $data['cancellation_party'] ?? null;
            $cancellationReason  = $data['cancellation_reason'] ?? $data['reason'] ?? null;
            $waivePenalty        = (bool) ($data['waive_penalty'] ?? false);
            $refundRemainingRent = (bool) ($data['refund_remaining_rent'] ?? false);

            $depositAmount = (float) $contract->deposit_amount;
            $isEarlyTermination = $contract->isEarlyTermination();

            // ── Smart Deposit Logic ─────────────────────────────────────────────
            // Rule 1: Tenant tự ý dời trước hạn + Manager không miễn phạt → Phạt toàn bộ cọc
            // Rule 2: Tenant dời trước hạn + Manager chấp nhận miễn phạt → Hoàn cọc
            // Rule 3: Chủ nhà hủy / Hai bên thỏa thuận → Hoàn cọc
            // Rule 4: Kết thúc đúng hạn → REFUND_PENDING (chời bác không phạt)

            $forfeitDeposit = false;

            if ($cancellationParty === 'TENANT' && $isEarlyTermination && ! $waivePenalty) {
                $forfeitDeposit = true; // Rule 1: Phạt cọc
            }

            $refundedAmount  = 0;
            $forfeitedAmount = 0;

            if ($forfeitDeposit) {
                $forfeitedAmount = $depositAmount;
                $depositStatus   = DepositStatus::FORFEITED;
                $contractStatus  = ContractStatus::CANCELLED; // Huỷ ngang → CANCELLED
            } else {
                $refundedAmount = $depositAmount;
                $depositStatus  = DepositStatus::REFUND_PENDING;
                $contractStatus = ContractStatus::TERMINATED; // Thỏa thuận / đương hạn → TERMINATED
            }

            $contract->status             = $contractStatus;
            $contract->deposit_status     = $depositStatus;
            $contract->end_date           = $terminationDate;
            $contract->terminated_at      = now();
            $contract->cancelled_at       = $forfeitDeposit ? now() : null;
            $contract->cancellation_party = $cancellationParty;
            $contract->cancellation_reason = $cancellationReason;
            $contract->refunded_amount    = $refundedAmount;
            $contract->forfeited_amount   = $forfeitedAmount;
            $contract->meta               = array_merge($contract->meta ?? [], [
                'termination_details' => [
                    'is_early_termination'  => $isEarlyTermination,
                    'cancellation_party'    => $cancellationParty,
                    'cancellation_reason'   => $cancellationReason,
                    'waive_penalty'         => $waivePenalty,
                    'forfeit_deposit'       => $forfeitDeposit,
                    'refund_remaining_rent' => $refundRemainingRent,
                    'original_end_date'     => $contract->getOriginal('end_date'),
                ],
            ]);
            $contract->save();

            // ── Settlement Invoice (is_termination = true) ────────────────────────
            $items = $this->buildSettlementItems(
                contract: $contract,
                terminationDate: $terminationDate,
                forfeitDeposit: $forfeitDeposit,
                depositAmount: $depositAmount,
                refundRemainingRent: $refundRemainingRent,
            );

            $this->invoiceService->create([
                'org_id'      => $contract->org_id,
                'property_id' => $contract->property_id,
                'room_id'     => $contract->room_id,
                'contract_id' => $contract->id,
                'status'      => 'DRAFT',
                'issue_date'  => $terminationDate,
                'due_date'    => $terminationDate,
                'period_start' => $terminationDate,
                'period_end'  => $terminationDate,
                'is_termination' => true,
                'snapshot'    => [
                    'is_termination'     => true,
                    'cancellation_party' => $cancellationParty,
                    'forfeit_deposit'    => $forfeitDeposit,
                    'is_early'           => $isEarlyTermination,
                ],
            ], $items);

            // Free the room
            if ($contract->room) {
                $contract->room->update(['status' => 'available']);
            }

            return true;
        });
    }

    /**
     * Tenant gửi yêu cầu dời đi trước hạn.
     *
     * Contract chuyển sang PENDING_TERMINATION, ghi lại ngày báo trước.
     */
    public function requestTermination(Contract $contract, User $requester, array $data): bool
    {
        $allowedStatuses = array_map(
            fn ($e) => $e instanceof \BackedEnum ? $e->value : (string) $e,
            ContractStatus::allowRequestTermination()
        );

        $currentStatus = $contract->status instanceof \BackedEnum
            ? $contract->status->value
            : (string) $contract->status;

        if (! in_array($currentStatus, $allowedStatuses)) {
            throw new \Exception('Chỉ có thể gửi yêu cầu dời khi hợp đồng đang hiệu lực.');
        }

        return DB::transaction(function () use ($contract, $data) {
            $contract->update([
                'status'             => ContractStatus::PENDING_TERMINATION,
                'notice_given_at'    => now(),
                'cancellation_party' => ContractCancellationParty::TENANT->value,
                'cancellation_reason' => $data['reason'] ?? null,
            ]);

            return true;
        });
    }

    /**
     * Thực hiện chuyển phòng (Execute Room Transfer).
     *
     * 1. Thanh lý hợp đồng A.
     * 2. Tạo hợp đồng B, copy các thành viên.
     * 3. Tính dư và chuyển cọc -> Invoice Adjustment Credit cho hóa đơn B.
     */
    public function executeTransfer(Contract $oldContract, array $data, User $performer): Contract
    {
        return DB::transaction(function () use ($oldContract, $data, $performer) {
            $transferDate = \Carbon\Carbon::parse($data['transfer_date']);
            $targetRoomId = $data['target_room_id'];
            $transferUnusedRent = $data['transfer_unused_rent'] ?? false;

            // 1. Tính toán tiền dư nếu transfer_unused_rent = true
            $unusedRentAmount = 0;
            if ($transferUnusedRent && $oldContract->next_billing_date) {
                // Tính số ngày dư từ ngày chuyển đến next_billing_date
                $nextBilling = \Carbon\Carbon::parse($oldContract->next_billing_date);
                if ($transferDate->lt($nextBilling)) {
                    $daysInCurrentCycle = 30; // Mặc định 30 ngày để tính giá trị ngày
                    $unusedDays = $nextBilling->diffInDays($transferDate);
                    
                    if ($unusedDays > 0) {
                        $dailyRent = $oldContract->rent_price / $daysInCurrentCycle;
                        $unusedRentAmount = round($dailyRent * $unusedDays, 0); // Làm tròn số tiền
                    }
                }
            }

            $oldDeposit = (float) $oldContract->deposit_amount;
            $totalCreditAmount = $oldDeposit + $unusedRentAmount;

            // 2. Chấm dứt hợp đồng cũ (MUTUAL agree, waive_penalty = true)
            $this->terminate($oldContract, [
                'termination_date' => $transferDate->toDateString(),
                'cancellation_party' => 'MUTUAL',
                'cancellation_reason' => 'Chuyển sang phòng mới ID: ' . $targetRoomId,
                'waive_penalty' => true,
                'refund_remaining_rent' => false, // Ta không trả về client mà chuyển thành Credit cho HD mới
            ]);

            // 3. Tạo hợp đồng mới
            $targetRoom = \App\Models\Property\Room::findOrFail($targetRoomId);
            
            $newContractData = [
                'org_id' => $oldContract->org_id,
                'property_id' => $targetRoom->property_id,
                'room_id' => $targetRoomId,
                'start_date' => $transferDate->toDateString(),
                'rent_price' => $data['rent_price'] ?? null,
                'deposit_amount' => $data['deposit_amount'] ?? null,
                // Kế thừa chu kỳ thanh toán
                'billing_cycle' => $oldContract->billing_cycle,
                'due_day' => $oldContract->due_day,
                'cutoff_day' => $oldContract->cutoff_day,
            ];

            // Thiết lập user members
            $membersData = [];
            foreach ($oldContract->members as $member) {
                $membersData[] = [
                    'user_id' => $member->user_id,
                    'is_primary' => $member->is_primary,
                    'status' => 'APPROVED', // Thành viên từ HD cũ tự động APPROVED
                    'joined_at' => $transferDate->toDateTimeString(),
                ];
            }
            $newContractData['members'] = $membersData;

            $newContract = $this->create($newContractData, $performer);

            // Bỏ qua PENDING_SIGNATURE, set PENDING_PAYMENT
            $newContract->update([
                'status' => \App\Enums\ContractStatus::PENDING_PAYMENT,
                'signed_at' => now(),
            ]);

            // 4. Tạo Initial Invoice cho hợp đồng mới
            $primaryMember = $newContract->members->firstWhere('is_primary', true)?->user;
            $initialInvoice = $this->createInitialInvoice($newContract, $primaryMember ?? $performer);

            // 5. Tạo Credit Adjustment cho hóa đơn ban đầu
            if ($totalCreditAmount > 0) {
                \App\Models\Invoice\InvoiceAdjustment::create([
                    'org_id' => $newContract->org_id,
                    'invoice_id' => $initialInvoice->id,
                    'type' => 'CREDIT',
                    'amount' => $totalCreditAmount,
                    'reason' => 'Chuyển cọc (' . number_format($oldDeposit) . ') & tiền dư (' . number_format($unusedRentAmount) . ') từ phòng cũ.',
                    'created_by_user_id' => $performer->id,
                    'approved_by_user_id' => $performer->id, // Tự động duyệt
                    'approved_at' => now(),
                ]);

                // Tính lại bill
                $this->invoiceService->recalculateTotalAmount($initialInvoice);
                
                // Nếu hóa đơn trả về 0 sau khi bù trừ, tự động đóng (PAID) hóa đơn và kích hoạt HD
                if ($initialInvoice->total_amount <= 0) {
                    $this->invoiceService->payInvoice($initialInvoice, 'Thanh toán bằng cấn trừ từ phòng cũ.');
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
     * Xây dựng danh sách các mục trong Settlement Invoice khi thanh lý.
     */
    private function buildSettlementItems(
        Contract $contract,
        string $terminationDate,
        bool $forfeitDeposit,
        float $depositAmount,
        bool $refundRemainingRent,
    ): array {
        $items = [];

        // Tiền thuê tháng cuối (nếu có)
        $items[] = [
            'type'        => InvoiceItemType::RENT->value,
            'description' => 'Tiền thuê tháng cuối / phí thanh lý',
            'quantity'    => 1,
            'unit_price'  => (float) $contract->rent_price,
            'amount'      => (float) $contract->rent_price,
        ];

        if ($depositAmount > 0) {
            if ($forfeitDeposit) {
                // Phạt cọc — ghi rõ lý do
                $items[] = [
                    'type'        => InvoiceItemType::PENALTY->value,
                    'description' => 'Tiền cọc bị phạt thu (huỷ hợp đồng trước hạn)',
                    'quantity'    => 1,
                    'unit_price'  => $depositAmount,
                    'amount'      => $depositAmount,
                    'meta'        => ['note' => 'Đã thu trước, không hoàn lại'],
                ];
            } else {
                // Hoàn cọc — ghi dương để rõ chuức năng
                $items[] = [
                    'type'        => InvoiceItemType::ADJUSTMENT->value,
                    'description' => 'Hoàn trả tiền đặt cọc cho khách',
                    'quantity'    => 1,
                    'unit_price'  => -$depositAmount, // âm = cần trả lại cho khách
                    'amount'      => -$depositAmount,
                    'meta'        => ['note' => 'Chuyển sang trạng thái REFUND_PENDING'],
                ];
            }
        }

        return $items;
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
        $endDate = $activeContract->end_date ? \Carbon\Carbon::parse($activeContract->end_date) : null;

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
        return ! $contract->members()
            ->whereNull('left_at')
            ->where('status', '!=', 'APPROVED')
            ->exists();
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

        $minimumEndDate = \Carbon\Carbon::parse($startDate)
            ->addMonths($this->resolveBillingCycleMonths($billingCycle))
            ->toDateString();

        if (\Carbon\Carbon::parse($endDate)->lt(\Carbon\Carbon::parse($minimumEndDate))) {
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
