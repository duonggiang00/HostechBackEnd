<?php

namespace App\Features\Ticket\Services;

use App\Features\Contract\Models\Contract;
use App\Features\Ticket\Models\Ticket;
use App\Features\Ticket\Models\TicketCost;
use App\Features\Ticket\Models\TicketEvent;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TicketService
{
    // ╔═══════════════════════════════════════════════════════╗
    // ║  READ OPERATIONS                                      ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách tickets (pagination + filter + sort + search).
     */
    public function paginate(
        array $allowedFilters = [],
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ): LengthAwarePaginator {
        $query = QueryBuilder::for(Ticket::class)
            ->allowedFilters(array_merge($allowedFilters, [
                AllowedFilter::exact('status'),
                AllowedFilter::exact('priority'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('assigned_to_user_id'),
                AllowedFilter::exact('contract_id'),
            ]))
            ->allowedSorts([
                'created_at',
                'updated_at',
                'due_at',
                'priority',
                'status',
            ])
            ->defaultSort('-created_at')
            ->with(['property', 'room', 'createdBy', 'assignedTo']);

        $user = request()->user();

        if ($user && $user->hasRole('Tenant')) {
            $query->where('created_by_user_id', $user->id);
        } elseif ($user && $user->hasRole(['Manager', 'Staff'])) {
            $query->whereHas('property.managers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } else {
            $orgId = $orgId ?? ($user?->hasRole('Admin') ? request()->input('org_id') : $user?->org_id);
            if ($orgId) {
                $query->where('tickets.org_id', $orgId);
            }
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Tìm 1 ticket kèm relationships.
     */
    public function find(string $id): ?Ticket
    {
        return Ticket::with([
            'property',
            'room',
            'contract',
            'createdBy',
            'assignedTo',
            'events.actor',
            'costs.createdBy',
        ])->find($id);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  WRITE OPERATIONS                                     ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tạo ticket mới + ghi event CREATED tự động.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Ticket
    {
        $user = request()->user();
        $data['org_id'] = $data['org_id'] ?? $user?->org_id;
        $data['created_by_user_id'] = $data['created_by_user_id'] ?? $user?->id;
        $data['priority'] = $data['priority'] ?? 'MEDIUM';
        $data['status'] = $data['status'] ?? 'OPEN';

        return DB::transaction(function () use ($data) {
            // Tự động gán contract_id nếu phòng đang có hợp đồng Active
            if (empty($data['contract_id']) && ! empty($data['room_id'])) {
                $activeContract = Contract::where('room_id', $data['room_id'])
                    ->where('status', 'ACTIVE')
                    ->first();

                if ($activeContract) {
                    $data['contract_id'] = $activeContract->id;
                }
            }

            $data['status'] = $data['status'] ?? 'OPEN';

            $ticket = Ticket::create($data);

            // Ghi event CREATED
            TicketEvent::create([
                'org_id' => $ticket->org_id,
                'ticket_id' => $ticket->id,
                'actor_user_id' => $ticket->created_by_user_id,
                'type' => 'CREATED',
                'message' => 'Tạo phiếu yêu cầu mới.',
            ]);

            return $ticket;
        });
    }

    /**
     * Cập nhật thông tin cơ bản ticket (priority, category, assignee, due_at).
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Ticket $ticket, array $data): Ticket
    {
        $ticket->update($data);

        return $ticket->fresh(['property', 'room', 'createdBy', 'assignedTo']);
    }

    /**
     * Chuyển trạng thái ticket + ghi event STATUS_CHANGED.
     *
     * @param  array{status: string, message?: string}  $data
     */
    public function updateStatus(Ticket $ticket, array $data, string $actorUserId): Ticket
    {
        return DB::transaction(function () use ($ticket, $data, $actorUserId) {
            $updatePayload = ['status' => $data['status']];

            // Tự động điền closed_at khi DONE hoặc CANCELLED
            if (in_array($data['status'], ['DONE', 'CANCELLED'])) {
                $updatePayload['closed_at'] = now();
            } elseif ($ticket->closed_at && ! in_array($data['status'], ['DONE', 'CANCELLED'])) {
                // Reopen → xóa closed_at
                $updatePayload['closed_at'] = null;
            }

            $ticket->update($updatePayload);

            // Ghi event STATUS_CHANGED
            TicketEvent::create([
                'org_id' => $ticket->org_id,
                'ticket_id' => $ticket->id,
                'actor_user_id' => $actorUserId,
                'type' => 'STATUS_CHANGED',
                'message' => $data['message'] ?? null,
                'meta' => ['new_status' => $data['status']],
            ]);

            return $ticket->fresh(['property', 'room', 'createdBy', 'assignedTo']);
        });
    }

    /**
     * Thêm comment/event vào ticket.
     *
     * @param  array{message: string}  $data
     */
    public function addEvent(Ticket $ticket, array $data, string $actorUserId): TicketEvent
    {
        return TicketEvent::create([
            'org_id' => $ticket->org_id,
            'ticket_id' => $ticket->id,
            'actor_user_id' => $actorUserId,
            'type' => 'COMMENT',
            'message' => $data['message'],
        ]);
    }

    /**
     * Thêm chi phí vào ticket.
     *
     * Chỉ được thêm khi ticket đã ở trạng thái IN_PROGRESS, WAITING_PARTS, hoặc DONE.
     *
     * @param  array{amount: float, payer: string, note?: string}  $data
     *
     * @throws \InvalidArgumentException
     */
    public function addCost(Ticket $ticket, array $data, string $createdByUserId): TicketCost
    {
        $allowedStatuses = ['IN_PROGRESS', 'WAITING_PARTS', 'DONE'];

        if (! in_array($ticket->status, $allowedStatuses)) {
            throw new \InvalidArgumentException(
                'Chỉ được thêm chi phí khi ticket đang IN_PROGRESS, WAITING_PARTS hoặc DONE.'
            );
        }

        return TicketCost::create([
            'org_id' => $ticket->org_id,
            'ticket_id' => $ticket->id,
            'amount' => $data['amount'],
            'payer' => $data['payer'],
            'note' => $data['note'] ?? null,
            'created_by_user_id' => $createdByUserId,
        ]);
    }

    /**
     * Xóa ticket.
     */
    public function delete(Ticket $ticket): bool
    {
        return (bool) $ticket->delete();
    }
}
