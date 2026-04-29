<?php

namespace App\Providers;

use App\Events\Billing\InvoiceGenerated;
use App\Events\Contract\ContractActivated;
use App\Events\Contract\Termination\DebtReconciliationTriggered;
use App\Events\Contract\Termination\FinalInvoiceGenerated;
use App\Events\Contract\Termination\HandoverSubmitted;
use App\Events\Contract\Termination\SettlementResolved;
use App\Events\Contract\Termination\TerminationInitiated;
use App\Events\Finance\PaymentSuccessfullyVerified;
use App\Events\Finance\PaymentVoided;
use App\Events\Finance\ReceiptGenerated;
use App\Events\Meter\BulkMeterReadingsApproved;
use App\Events\Meter\MeterReadingApproved;
use App\Events\Meter\MeterReadingCreated;
use App\Events\Property\BuildingOverviewUpdated;
use App\Events\Property\FloorCreated;
use App\Events\Property\FloorDeleted;
use App\Events\Property\FloorUpdated;
use App\Events\Property\PropertyCreated;
use App\Events\Property\PropertyUpdated;
use App\Events\Property\RoomCreated;
use App\Events\Property\RoomDeleted;
use App\Events\Property\RoomUpdated;
use App\Listeners\Billing\GenerateInvoicePdf;
use App\Listeners\Billing\LockMeterReadingsAfterInvoiceGenerated;
use App\Listeners\Billing\SnapshotContractServices;
use App\Listeners\Contract\Termination\CreateTerminationFinalInvoice;
use App\Listeners\Contract\Termination\DispatchDebtReconciliation;
use App\Listeners\Contract\Termination\FinalizeTerminationSettlement;
use App\Listeners\Contract\Termination\RunTerminationDebtReconciliation;
use App\Listeners\Contract\Termination\TerminationInitiatedCreateHandoverAndLockMeters;
use App\Listeners\Finance\BroadcastInvoicePaidAfterPaymentVerified;
use App\Listeners\Finance\GeneratePaymentReceipt;
use App\Listeners\Finance\LogPaymentActivity;
use App\Listeners\Finance\NotifyTenantPaymentReceived;
use App\Listeners\Finance\RecordPaymentLedger;
use App\Listeners\Finance\ReversePaymentLedger;
use App\Listeners\Meter\DispatchMeterNotifications;
use App\Listeners\Meter\PerformBatchMasterAggregation;
use App\Listeners\Meter\PerformMasterAggregation;
use App\Listeners\Meter\SynchronizeMeterMetadata;
use App\Listeners\Notification\NotifyTenantInvoiceIssued;
use App\Listeners\Property\ClearBuildingOverviewCache;
use App\Listeners\Property\InitializeRoomServices;
use App\Listeners\Property\NotifyPropertyManagers;
use App\Listeners\Property\RefreshPropertyStats;
use App\Models\Contract\Contract;
use App\Models\Finance\Payment;
use App\Models\Invoice\Invoice;
use App\Models\Meter\MeterReading;
use App\Models\Property\Floor;
use App\Models\Property\Room;
use App\Models\Ticket\Ticket;
use App\Observers\ContractObserver;
use App\Observers\FloorObserver;
use App\Observers\InvoiceObserver;
use App\Observers\MeterReadingObserver;
use App\Observers\PaymentObserver;
use App\Observers\RoomObserver;
use App\Observers\TicketObserver;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Contract::observe(ContractObserver::class);
        Room::observe(RoomObserver::class);
        Floor::observe(FloorObserver::class);
        Ticket::observe(TicketObserver::class);
        Invoice::observe(InvoiceObserver::class);
        Payment::observe(PaymentObserver::class);
        MeterReading::observe(MeterReadingObserver::class);

        Event::listen(
            BuildingOverviewUpdated::class,
            ClearBuildingOverviewCache::class,
        );

        Event::listen(
            [
                RoomCreated::class,
                RoomUpdated::class,
            ],
            InitializeRoomServices::class,
        );

        // --- PROPERTY STATS REFRESH (EDA) ---
        Event::listen(
            [
                RoomCreated::class,
                RoomUpdated::class,
                RoomDeleted::class,
                FloorCreated::class,
                FloorDeleted::class,
                PropertyCreated::class,
                PropertyUpdated::class,
            ],
            RefreshPropertyStats::class,
        );

        // --- BUILDING OVERVIEW CACHE BUSTING (EDA) ---
        Event::listen(
            [
                RoomCreated::class,
                RoomUpdated::class,
                RoomDeleted::class,
                FloorUpdated::class,
                FloorDeleted::class,
                BuildingOverviewUpdated::class,
            ],
            ClearBuildingOverviewCache::class,
        );

        // --- METER EDA ---
        Event::listen(
            MeterReadingCreated::class,
            NotifyPropertyManagers::class // Example: placeholder for actual notification logic
        );

        Event::listen(MeterReadingApproved::class, PerformMasterAggregation::class);
        Event::listen(MeterReadingApproved::class, SynchronizeMeterMetadata::class);
        Event::listen(MeterReadingApproved::class, DispatchMeterNotifications::class);

        // Batch event: fired when multiple readings are approved at once (bulkStore, cascade)
        // One job handles ALL readings instead of N individual jobs → eliminates race conditions
        Event::listen(
            BulkMeterReadingsApproved::class,
            PerformBatchMasterAggregation::class,
        );
        Event::listen(
            BulkMeterReadingsApproved::class,
            DispatchMeterNotifications::class,
        );

        // --- BILLING EDA ---
        // When a Contract transitions to ACTIVE, snapshot service prices into meta
        Event::listen(
            ContractActivated::class,
            SnapshotContractServices::class,
        );

        // When an Invoice is generated, notify the tenant asynchronously
        Event::listen(
            InvoiceGenerated::class,
            NotifyTenantInvoiceIssued::class,
        );

        Event::listen(
            InvoiceGenerated::class,
            GenerateInvoicePdf::class,
        );

        Event::listen(
            InvoiceGenerated::class,
            LockMeterReadingsAfterInvoiceGenerated::class,
        );

        // --- FINANCE (PAYMENT) EDA ---
        // When a Payment is APPROVED (manual staff approval or VNPay IPN):
        //   1. Record double-entry ledger
        //   2. Log activity
        //   3. Generate official PDF receipt (PROOF uploads stay in receipts.kind=PROOF)
        //   4. Broadcast per-invoice PAID payloads for realtime UI
        Event::listen(PaymentSuccessfullyVerified::class, RecordPaymentLedger::class);
        Event::listen(PaymentSuccessfullyVerified::class, LogPaymentActivity::class.'@handleApproved');
        Event::listen(PaymentSuccessfullyVerified::class, GeneratePaymentReceipt::class);
        Event::listen(PaymentSuccessfullyVerified::class, BroadcastInvoicePaidAfterPaymentVerified::class);
        // When a Receipt is GENERATED:
        //   1. Notify tenant with the actual receipt link
        Event::listen(ReceiptGenerated::class, NotifyTenantPaymentReceived::class);

        // When a Payment is VOIDED:
        //   1. Record reversal credit entry in ledger
        //   2. Log activity for audit trail
        Event::listen(PaymentVoided::class, ReversePaymentLedger::class);
        Event::listen(PaymentVoided::class, LogPaymentActivity::class.'@handleVoided');

        // --- CONTRACT TERMINATION (EDA) ---
        Event::listen(TerminationInitiated::class, TerminationInitiatedCreateHandoverAndLockMeters::class);
        Event::listen(HandoverSubmitted::class, CreateTerminationFinalInvoice::class);
        Event::listen(FinalInvoiceGenerated::class, DispatchDebtReconciliation::class);
        Event::listen(DebtReconciliationTriggered::class, RunTerminationDebtReconciliation::class);
        Event::listen(SettlementResolved::class, FinalizeTerminationSettlement::class);

        $this->configureRateLimiting();

        if (! app()->environment('production')) {
            Gate::after(function ($user, string $ability, $result, array $arguments): ?bool {
                if (! $user || $result !== false) {
                    return null;
                }

                $route = request()->route();
                $modelRef = null;
                $first = $arguments[0] ?? null;
                if (is_object($first) && method_exists($first, 'getKey')) {
                    $modelRef = $first::class.'#'.$first->getKey();
                }

                Log::debug('policy_denied', [
                    'user_id' => $user->id ?? null,
                    'ability' => $ability,
                    'route' => $route?->getName() ?? $route?->uri(),
                    'model' => $modelRef,
                ]);

                return null;
            });
        }

        Gate::define('viewApiDocs', function ($user = null) {
            // Allow access in local environment or if user is Admin/SuperAdmin
            return app()->environment('local') || ($user && $user->hasRole('Admin'));
        });

        Scramble::afterOpenApiGenerated(function (OpenApi $openApi) {
            $openApi->secure(
                SecurityScheme::http('bearer')
            );

            // Group Fortify/Sanctum Auth routes
            foreach ($openApi->paths as $path => $pathItem) {
                foreach ($pathItem->operations as $operation) {
                    $tags = $operation->tags;

                    // List of Fortify/Auth related tags (Controller names)
                    $authTags = [
                        'AuthenticatedSession',
                        'ConfirmablePassword',
                        'ConfirmedPasswordStatus',
                        'ConfirmedTwoFactorAuthentication',
                        'NewPassword',
                        'Password',
                        'PasswordResetLink',
                        'ProfileInformation',
                        'RecoveryCode',
                        'RegisteredUser',
                        'TwoFactorAuthenticatedSession',
                        'TwoFactorAuthentication',
                        'TwoFactorQrCode',
                        'VerifyEmail',
                        'Authentication', // Default tag if using AuthenticationController
                    ];

                    // Check if any existing tag matches standard Fortify controllers
                    $matchedTag = null;
                    foreach ($tags as $tag) {
                        if (in_array($tag, $authTags)) {
                            $matchedTag = $tag;
                            break;
                        }
                    }

                    // Apply grouping and descriptions if it's a known Auth tag
                    if ($matchedTag) {
                        $operation->tags = ['Xác thực (Auth)'];

                        // Add Vietnamese descriptions based on Tag
                        if ($matchedTag === 'AuthenticatedSession') {
                            $operation->summary = 'Đăng nhập';
                            $operation->description = 'Đăng nhập vào hệ thống để lấy token.';
                        } elseif ($matchedTag === 'RegisteredUser') {
                            $operation->summary = 'Đăng ký';
                            $operation->description = 'Đăng ký tài khoản mới.';
                        } elseif ($matchedTag === 'PasswordResetLink') {
                            $operation->summary = 'Quên mật khẩu';
                            $operation->description = 'Gửi email chứa link đặt lại mật khẩu.';
                        } elseif ($matchedTag === 'NewPassword') {
                            $operation->summary = 'Đặt lại mật khẩu';
                            $operation->description = 'Thực hiện đổi mật khẩu mới từ token reset.';
                        } elseif ($matchedTag === 'ProfileInformation') {
                            $operation->summary = 'Cập nhật thông tin';
                            $operation->description = 'Cập nhật tên, email của người dùng.';
                        } elseif ($matchedTag === 'Password') {
                            $operation->summary = 'Đổi mật khẩu';
                            $operation->description = 'Thay đổi mật khẩu hiện tại sang mật khẩu mới.';
                        } elseif ($matchedTag === 'TwoFactorAuthentication' || $matchedTag === 'TwoFactorAuthenticatedSession') {
                            $operation->summary = 'Bật/Tắt/Xác thực 2FA';
                            $operation->description = 'Quản lý xác thực 2 lớp.';
                        } elseif ($matchedTag === 'TwoFactorQrCode') {
                            $operation->summary = 'Lấy mã QR 2FA';
                            $operation->description = 'Lấy SVG mã QR để quét bằng ứng dụng Authenticator.';
                        } elseif ($matchedTag === 'RecoveryCode') {
                            $operation->summary = 'Mã khôi phục 2FA';
                            $operation->description = 'Lấy danh sách mã khôi phục dự phòng.';
                        } elseif ($matchedTag === 'ConfirmedPasswordStatus') {
                            $operation->summary = 'Trạng thái xác nhận mật khẩu';
                            $operation->description = 'Kiểm tra xem người dùng đã xác nhận mật khẩu gần đây chưa.';
                        } elseif ($matchedTag === 'ConfirmablePassword') {
                            $operation->summary = 'Xác nhận mật khẩu';
                            $operation->description = 'Xác nhận lại mật khẩu (cho các hành động nhạy cảm).';
                        }
                    }
                }
            }
        });
    }

    protected function configureRateLimiting(): void
    {
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->input('email') ?: $request->ip());
        });

        RateLimiter::for('two-factor', function (Request $request) {
            $key = $request->session()->get('fortify.two_factor_user_id') ?: $request->ip();

            return Limit::perMinute(10)->by($key);
        });

        RateLimiter::for('payment-proof-submit', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('meter-submit', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });
    }
}
