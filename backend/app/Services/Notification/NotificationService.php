<?php

namespace App\Services\Notification;

use App\Models\Meter\MeterReading;
use App\Models\Notification\NotificationLog;
use App\Models\Notification\NotificationTemplate;
use App\Models\Org\User;
use App\Notifications\Meter\MeterReadingApproved;
use App\Notifications\Meter\MeterReadingRejected;
use App\Notifications\Meter\MeterReadingSubmitted;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
    /**
     * Dispatch notifications when a meter reading status changes.
     *
     * Flow:
     * - SUBMITTED → notify Manager(s) of the property
     * - APPROVED  → notify Staff (submitter) + Tenant(s) of the room
     * - REJECTED  → notify Staff (submitter)
     */
    public function notifyMeterReadingStatusChanged(MeterReading $reading, string $newStatus, ?string $reason = null): void
    {
        $reading->loadMissing(['meter.room.contracts.members', 'meter.property.managers', 'submittedBy', 'approvedBy']);

        match ($newStatus) {
            'SUBMITTED' => $this->handleSubmitted($reading),
            'APPROVED'  => $this->handleApproved($reading),
            'REJECTED'  => $this->handleRejected($reading, $reason),
            default     => null,
        };
    }

    /**
     * Staff submitted → notify Manager(s) of the property.
     */
    protected function handleSubmitted(MeterReading $reading): void
    {
        $submitterName = $reading->submittedBy?->full_name ?? 'Nhân viên';
        $managers = $this->getPropertyManagers($reading);

        if ($managers->isNotEmpty()) {
            Notification::send($managers, new MeterReadingSubmitted($reading, $submitterName));

            // Log notifications
            $this->logNotifications($managers, 'meter_reading_submitted', 'IN_APP', [
                'reading_id' => $reading->id,
                'submitted_by' => $submitterName,
            ]);
        }
    }

    /**
     * Manager approved → notify Staff (submitter) + Tenant(s).
     */
    protected function handleApproved(MeterReading $reading): void
    {
        $approverName = $reading->approvedBy?->full_name ?? 'Quản lý';
        $recipients = collect();

        // 1. Staff who submitted
        if ($reading->submittedBy) {
            $recipients->push($reading->submittedBy);
        }

        // 2. Active tenants of the room
        $tenants = $this->getRoomTenants($reading);
        $recipients = $recipients->merge($tenants);

        if ($recipients->isNotEmpty()) {
            $uniqueRecipients = $recipients->unique('id');
            Notification::send($uniqueRecipients, new MeterReadingApproved($reading, $approverName));

            $this->logNotifications($uniqueRecipients, 'meter_reading_approved', 'IN_APP', [
                'reading_id' => $reading->id,
                'approved_by' => $approverName,
            ]);
        }
    }

    /**
     * Manager rejected → notify Staff (submitter).
     */
    protected function handleRejected(MeterReading $reading, ?string $reason = null): void
    {
        $rejectorName = auth()->user()?->full_name ?? 'Quản lý';

        if ($reading->submittedBy) {
            $reading->submittedBy->notify(new MeterReadingRejected($reading, $rejectorName, $reason));

            $this->logNotifications(collect([$reading->submittedBy]), 'meter_reading_rejected', 'IN_APP', [
                'reading_id' => $reading->id,
                'rejected_by' => $rejectorName,
                'reason' => $reason,
            ]);
        }
    }

    /**
     * Get Manager(s) who manage the property where this meter belongs.
     */
    protected function getPropertyManagers(MeterReading $reading): \Illuminate\Support\Collection
    {
        $property = $reading->meter->property;

        if (!$property) {
            return collect();
        }

        return $property->managers()
            ->whereHas('roles', fn ($q) => $q->where('name', 'Manager'))
            ->get();
    }

    /**
     * Get active tenants of the room where this meter belongs.
     */
    protected function getRoomTenants(MeterReading $reading): \Illuminate\Support\Collection
    {
        $room = $reading->meter->room;

        if (!$room) {
            return collect();
        }

        return User::whereHas('contractMembers', function ($q) use ($room) {
            $q->where('status', 'APPROVED')
                ->whereHas('contract', function ($cq) use ($room) {
                    $cq->where('room_id', $room->id)
                        ->where('status', 'ACTIVE');
                });
        })->get();
    }

    // ──────────────────────────────────────────────────
    // Phase 2: Template Resolution & Logging
    // ──────────────────────────────────────────────────

    /**
     * Resolve a notification template by code and channel.
     * Looks for property-specific template first, then org-level fallback.
     *
     * @return array{title: string|null, body: string}|null
     */
    public function resolveTemplate(string $code, string $channel, array $data, ?string $orgId = null, ?string $propertyId = null): ?array
    {
        $orgId = $orgId ?? auth()->user()?->org_id;

        if (!$orgId) {
            return null;
        }

        // 1. Try property-specific template first
        $template = null;
        if ($propertyId) {
            $template = NotificationTemplate::active()
                ->byCode($code)
                ->byChannel($channel)
                ->where('org_id', $orgId)
                ->where('property_id', $propertyId)
                ->first();
        }

        // 2. Fallback to org-level template
        if (!$template) {
            $template = NotificationTemplate::active()
                ->byCode($code)
                ->byChannel($channel)
                ->where('org_id', $orgId)
                ->whereNull('property_id')
                ->first();
        }

        if (!$template) {
            return null;
        }

        return $template->render($data);
    }

    /**
     * Log notification sends to notification_logs table.
     */
    public function logNotifications(
        \Illuminate\Support\Collection $recipients,
        string $code,
        string $channel,
        array $payload,
        ?string $ruleId = null
    ): void {
        $orgId = auth()->user()?->org_id;

        if (!$orgId) {
            return;
        }

        $logs = $recipients->map(fn (User $user) => [
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'org_id' => $orgId,
            'rule_id' => $ruleId,
            'user_id' => $user->id,
            'channel' => $channel,
            'status' => 'SENT',
            'payload' => json_encode(array_merge($payload, ['code' => $code])),
            'created_at' => now(),
        ])->toArray();

        try {
            NotificationLog::insert($logs);
        } catch (\Throwable $e) {
            Log::error('Failed to log notifications', [
                'code' => $code,
                'error' => $e->getMessage(),
            ]);
        }
    }

    // ──────────────────────────────────────────────────
    // Notification CRUD API (for frontend)
    // ──────────────────────────────────────────────────

    /**
     * Get paginated notifications for a user.
     */
    public function getUserNotifications(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return $user->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get unread notification count.
     */
    public function getUnreadCount(User $user): int
    {
        return $user->unreadNotifications()->count();
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(string $notificationId, User $user): bool
    {
        $notification = $user->notifications()->where('id', $notificationId)->first();

        if (!$notification) {
            return false;
        }

        $notification->markAsRead();

        return true;
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(User $user): int
    {
        $count = $user->unreadNotifications()->count();
        $user->unreadNotifications->markAsRead();

        return $count;
    }
}
