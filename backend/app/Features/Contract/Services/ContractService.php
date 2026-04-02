<?php

namespace App\Features\Contract\Services;

use App\Features\Contract\Enums\ContractStatus;
use App\Features\Contract\Enums\DepositStatus;
use App\Enums\InvoiceItemType;
use App\Features\Contract\Models\Contract;
use App\Features\Contract\Models\ContractMember;
use App\Features\Invoice\Models\Invoice;
use App\Features\Org\Models\User;
use App\Features\Invoice\Services\InvoiceService;
use App\Features\Service\Services\ServiceService;
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
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as draft_count", [ContractStatus::DRAFT->value])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_count", [ContractStatus::PENDING->value])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active_count", [ContractStatus::ACTIVE->value])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as ended_count", [ContractStatus::ENDED->value])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as terminated_count", [ContractStatus::TERMINATED->value])
            ->selectRaw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as expired_count", [ContractStatus::EXPIRED->value])
            ->selectRaw("SUM(CASE WHEN status = ? AND end_date IS NOT NULL AND end_date BETWEEN ? AND ? THEN 1 ELSE 0 END) as expiring_count", [ContractStatus::ACTIVE->value, $now, $in30])
            ->first();

        return [
            'total'      => (int) ($row->total ?? 0),
            'DRAFT'      => (int) ($row->draft_count ?? 0),
            'PENDING'    => (int) ($row->pending_count ?? 0),
            'ACTIVE'     => (int) ($row->active_count ?? 0),
            'ENDED'      => (int) ($row->ended_count ?? 0),
            'TERMINATED' => (int) ($row->terminated_count ?? 0),
            'EXPIRED'    => (int) ($row->expired_count ?? 0),
            'expiring'   => (int) ($row->expiring_count ?? 0),
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
        return Contract::with(['room', 'property', 'members.user', 'createdBy', 'invoices', 'handovers'])->find($id);
    }

    public function findTrashed(string $id): ?Contract
    {
        return Contract::onlyTrashed()->with(['room', 'property'])->find($id);
    }

    public function findWithTrashed(string $id): ?Contract
    {
        return Contract::withTrashed()->with(['room', 'property'])->find($id);
    }

    public function create(array $data, ?User $user = null): Contract
    {
        return DB::transaction(function () use ($data, $user) {
            $contractData = collect($data)->except(['members'])->toArray();

            if (! isset($contractData['org_id'])) {
                $contractData['org_id'] = $user?->org_id;
            }

            $contractData['created_by_user_id'] = $user?->id;

            if (! isset($contractData['join_code'])) {
                $contractData['join_code'] = $this->generateJoinCode();
            }

            $roomId = $contractData['room_id'] ?? null;
            $propertyId = $contractData['property_id'] ?? null;
            $startDate = $contractData['start_date'] ?? null;
            $endDate = $contractData['end_date'] ?? null;

            $property = $propertyId ? \App\Features\Property\Models\Property::find($propertyId) : null;
            $room = $roomId ? \App\Features\Property\Models\Room::find($roomId) : null;

            if ($property && $user?->org_id && $property->org_id !== $user->org_id) {
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

            if ($roomId && $startDate) {
                $overlap = $this->checkOverlap($roomId, $startDate, $endDate);
                if ($overlap) {
                    $overlapDate = $overlap->start_date . ($overlap->end_date ? " - " . $overlap->end_date : " (Vô thời hạn)");
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
                $contractData['cutoff_day'] = min(($contractData['cutoff_day'] ?? $property->default_cutoff_day ?? 25), 25);
                
                if (empty($contractData['rent_price'])) {
                    $contractData['rent_price'] = $room->base_price ?? 0;
                }

                if (empty($contractData['deposit_amount'])) {
                    $months = $property->default_deposit_months ?? 1;
                    $contractData['deposit_amount'] = (float) $contractData['rent_price'] * $months;
                }
            }

            if ((float) ($contractData['rent_price'] ?? 0) <= 0) {
                throw ValidationException::withMessages([
                    'rent_price' => 'Giá thê phải lớn hơn 0 sau khi áp dụng mặc định của phòng/tòa nhà.',
                ]);
            }

            if (($contractData['cutoff_day'] ?? null) !== null
                && ($contractData['due_day'] ?? null) !== null
                && (int) $contractData['cutoff_day'] > (int) $contractData['due_day']) {
                throw ValidationException::withMessages([
                    'cutoff_day' => 'Ngày chốt số không được sau hạn nộp.',
                ]);
            }

            $this->ensureEndDateMeetsBillingCycle(
                $contractData['start_date'] ?? null,
                $contractData['end_date'] ?? null,
                $contractData['billing_cycle'] ?? 1,
            );

            $rentPrice = (float) ($contractData['rent_price'] ?? 0);
            $contractData['base_rent'] = $rentPrice;

            $orgId = $contractData['org_id'];
            $fixedServicesFee = 0;

            if ($roomId) {
                $roomServices = $this->serviceService->getRoomServices($roomId, $orgId);
                foreach ($roomServices as $rs) {
                    if ($rs->service->calc_mode !== 'PER_METER') {
                        $fixedServicesFee += (float) ($rs->service->current_price * $rs->quantity);
                    }
                }
            }

            $contractData['fixed_services_fee'] = $fixedServicesFee;
            $contractData['total_rent'] = $rentPrice + $fixedServicesFee;

            $startDateObj = \Carbon\Carbon::parse($contractData['start_date']);
            $monthsToAdd = $this->resolveBillingCycleMonths($contractData['billing_cycle'] ?? 1);
            $contractData['next_billing_date'] = $startDateObj->copy()->addMonths($monthsToAdd)->format('Y-m-d');

            $contract = Contract::create($contractData);

            $primaryCount = collect($data['members'] ?? [])->where('is_primary', true)->count();

            if ($primaryCount !== 1) {
                throw ValidationException::withMessages([
                    'members' => 'Hợp đồng phải có đúng 1 người thuê chính.',
                ]);
            }

            if (isset($data['members']) && is_array($data['members'])) {
                foreach ($data['members'] as $memberData) {
                    $this->addMember($contract, $memberData, $user);
                }
            }

            return $contract->refresh();
        });
    }

    public function update(string $id, array $data): ?Contract
    {
        $contract = $this->find($id);
        if (! $contract) {
            return null;
        }

        return DB::transaction(function () use ($contract, $data) {
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
                $startDateObj = \Carbon\Carbon::parse($data['start_date'] ?? $contract->start_date);
                $monthsToAdd = $this->resolveBillingCycleMonths($data['billing_cycle'] ?? $contract->billing_cycle);
                $data['next_billing_date'] = $startDateObj->copy()->addMonths($monthsToAdd)->format('Y-m-d');
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

    public function delete(string $id): bool
    {
        $contract = $this->find($id);
        if (! $contract) {
            return false;
        }

        return DB::transaction(function () use ($contract) {
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
            $memberUpdateData = [
                'status' => 'APPROVED',
                'joined_at' => now(),
            ];

            if ($this->contractMembersHasSignedAtColumn()) {
                $memberUpdateData['signed_at'] = now();
            }

            $member->update($memberUpdateData);

            if ($contract->status === ContractStatus::PENDING && $this->allSignersApproved($contract)) {
                $contract->update([
                    'status' => ContractStatus::ACTIVE,
                    'signed_at' => now(),
                    'activated_at' => now(),
                ]);
                if ($contract->room) {
                    $contract->room->update(['status' => 'occupied']);
                }
            }

            return true;
        });
    }

    /**
     * Xác nhận thanh toán & Kích hoạt hợp đồng (Admin)
     */
    public function confirmPayment(Contract $contract, User $user): bool
    {
        $allowedStatuses = ContractStatus::allowedForConfirmation();
        if (! in_array($contract->status, $allowedStatuses)) {
            throw new \Exception('Chỉ có thể xác nhận thanh toán cho hợp đồng đang chờ thanh toán.');
        }

        return DB::transaction(function () use ($contract) {
            // 1. Mark contract as ACTIVE
            $contract->update([
                'status' => ContractStatus::ACTIVE,
                'activated_at' => now(),
                'signed_at' => $contract->signed_at ?? now(),
            ]);

            // Note: ContractObserver will handle room status sync via created/updated events
            
            return true;
        });
    }

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

            if ($contract->status === ContractStatus::PENDING) {
                $contract->update(['status' => ContractStatus::DRAFT]);
            }

            return true;
        });
    }

    public function myPendingContracts(User $user): \Illuminate\Database\Eloquent\Collection
    {
        return Contract::whereHas('members', function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->where('status', 'PENDING');
        })->with('property:id,name', 'room:id,code,name')->get();
    }

    public function getAvailableRoomsForTransfer(Contract $contract): \Illuminate\Database\Eloquent\Collection
    {
        return \App\Features\Property\Models\Room::where('property_id', $contract->property_id)
            ->where('status', 'available')
            ->where('id', '!=', $contract->room_id)
            ->select(['id', 'code', 'name', 'type', 'area', 'base_price', 'floor_number', 'capacity'])
            ->get();
    }

    public function requestRoomTransfer(Contract $contract, User $user, array $data): bool
    {
        $targetRoom = \App\Features\Property\Models\Room::where('id', $data['target_room_id'])
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

    public function addMember(Contract $contract, array $memberData, ?User $performer = null): ContractMember
    {
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

        if (! isset($memberData['status'])) {
            $memberData['status'] = 'PENDING';
        }

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

    public function terminate(Contract $contract, array $data): bool
    {
        if ($contract->status !== ContractStatus::ACTIVE) {
            throw new \Exception('Chỉ có thể thanh lý hợp đồng đang hoạt động.');
        }

        return DB::transaction(function () use ($contract, $data) {
            $terminationDate = $data['termination_date'] ?? now()->toDateString();
            $forfeitDeposit = (bool) ($data['forfeit_deposit'] ?? false);

            $depositAmount = (float) $contract->deposit_amount;
            
            if ($forfeitDeposit) {
                $contract->deposit_status = DepositStatus::FORFEITED;
                $contract->forfeited_amount = $depositAmount;
            } else {
                $contract->deposit_status = DepositStatus::REFUNDED;
                $contract->refunded_amount = $depositAmount;
            }

            $contract->status = ContractStatus::TERMINATED;
            $contract->end_date = $terminationDate;
            $contract->terminated_at = now();
            $contract->meta = array_merge($contract->meta ?? [], [
                'termination_details' => [
                    'reason' => $data['reason'] ?? null,
                    'forfeit_deposit' => $forfeitDeposit,
                ],
            ]);
            $contract->save();

            if ($contract->room) {
                $contract->room->update(['status' => 'available']);
            }

            return true;
        });
    }

    public function checkOverlap(string $roomId, string $startDate, ?string $endDate = null, ?string $excludeContractId = null): ?Contract
    {
        $query = Contract::where('room_id', $roomId)
            ->whereIn('status', [
                ContractStatus::ACTIVE,
                ContractStatus::PENDING,
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

    public function getRoomAvailabilityStatus(string $roomId): array
    {
        $activeContract = Contract::where('room_id', $roomId)
            ->whereIn('status', [ContractStatus::ACTIVE, ContractStatus::PENDING])
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
                'end_date' => "Ngày kết thúc không được nhỏ hơn {$minimumEndDate} theo chu kỳ thuê.",
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
