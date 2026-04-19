<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        \App\Models\Contract\Contract::observe(\App\Observers\ContractObserver::class);
        \App\Models\Property\Room::observe(\App\Observers\RoomObserver::class);
        \App\Models\Property\Floor::observe(\App\Observers\FloorObserver::class);
        \App\Models\Ticket\Ticket::observe(\App\Observers\TicketObserver::class);
        \App\Models\Invoice\Invoice::observe(\App\Observers\InvoiceObserver::class);
        \App\Models\Finance\Payment::observe(\App\Observers\PaymentObserver::class);
        \App\Models\Meter\MeterReading::observe(\App\Observers\MeterReadingObserver::class);



        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Property\BuildingOverviewUpdated::class,
            \App\Listeners\Property\ClearBuildingOverviewCache::class,
        );

        \Illuminate\Support\Facades\Event::listen(
            [
                \App\Events\Property\RoomCreated::class,
                \App\Events\Property\RoomUpdated::class,
            ],
            \App\Listeners\Property\InitializeRoomServices::class,
        );

        // --- PROPERTY STATS REFRESH (EDA) ---
        \Illuminate\Support\Facades\Event::listen(
            [
                \App\Events\Property\RoomCreated::class,
                \App\Events\Property\RoomUpdated::class,
                \App\Events\Property\RoomDeleted::class,
                \App\Events\Property\FloorCreated::class,
                \App\Events\Property\FloorDeleted::class,
                \App\Events\Property\PropertyCreated::class,
                \App\Events\Property\PropertyUpdated::class,
            ],
            \App\Listeners\Property\RefreshPropertyStats::class,
        );

        // --- BUILDING OVERVIEW CACHE BUSTING (EDA) ---
        \Illuminate\Support\Facades\Event::listen(
            [
                \App\Events\Property\RoomCreated::class,
                \App\Events\Property\RoomUpdated::class,
                \App\Events\Property\RoomDeleted::class,
                \App\Events\Property\FloorUpdated::class,
                \App\Events\Property\FloorDeleted::class,
                \App\Events\Property\BuildingOverviewUpdated::class,
            ],
            \App\Listeners\Property\ClearBuildingOverviewCache::class,
        );

        // --- METER EDA ---
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Meter\MeterReadingCreated::class,
            \App\Listeners\Property\NotifyPropertyManagers::class // Example: placeholder for actual notification logic
        );

        \Illuminate\Support\Facades\Event::listen(\App\Events\Meter\MeterReadingApproved::class, \App\Listeners\Meter\PerformMasterAggregation::class);
        \Illuminate\Support\Facades\Event::listen(\App\Events\Meter\MeterReadingApproved::class, \App\Listeners\Meter\SynchronizeMeterMetadata::class);
        \Illuminate\Support\Facades\Event::listen(\App\Events\Meter\MeterReadingApproved::class, \App\Listeners\Meter\DispatchMeterNotifications::class);

        // Batch event: fired when multiple readings are approved at once (bulkStore, cascade)
        // One job handles ALL readings instead of N individual jobs → eliminates race conditions
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Meter\BulkMeterReadingsApproved::class,
            \App\Listeners\Meter\PerformBatchMasterAggregation::class,
        );

        // --- BILLING EDA ---
        // When a Contract transitions to ACTIVE, snapshot service prices into meta
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Contract\ContractActivated::class,
            \App\Listeners\Billing\SnapshotContractServices::class,
        );

        // When an Invoice is generated, notify the tenant asynchronously
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Billing\InvoiceGenerated::class,
            \App\Listeners\Notification\NotifyTenantInvoiceIssued::class,
        );

        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Billing\InvoiceGenerated::class,
            \App\Listeners\Billing\GenerateInvoicePdf::class,
        );

        // --- FINANCE (PAYMENT) EDA ---
        // When a Payment is APPROVED (manual or VNPay IPN confirmed):
        //   1. Record double-entry ledger debit
        //   2. Notify tenant of payment confirmation
        //   3. Log activity for audit trail
        \Illuminate\Support\Facades\Event::listen(\App\Events\Finance\PaymentApproved::class, \App\Listeners\Finance\RecordPaymentLedger::class);
        // When a Receipt is GENERATED:
        //   1. Notify tenant with the actual receipt link
        \Illuminate\Support\Facades\Event::listen(\App\Events\Finance\ReceiptGenerated::class, \App\Listeners\Finance\NotifyTenantPaymentReceived::class);
        \Illuminate\Support\Facades\Event::listen(\App\Events\Finance\PaymentApproved::class, \App\Listeners\Finance\LogPaymentActivity::class . '@handleApproved');
        \Illuminate\Support\Facades\Event::listen(\App\Events\Finance\PaymentApproved::class, \App\Listeners\Finance\GeneratePaymentReceipt::class);

        // When a Payment is VOIDED:
        //   1. Record reversal credit entry in ledger
        //   2. Log activity for audit trail
        \Illuminate\Support\Facades\Event::listen(\App\Events\Finance\PaymentVoided::class, \App\Listeners\Finance\ReversePaymentLedger::class);
        \Illuminate\Support\Facades\Event::listen(\App\Events\Finance\PaymentVoided::class, \App\Listeners\Finance\LogPaymentActivity::class . '@handleVoided');

        $this->configureRateLimiting();

        \Illuminate\Support\Facades\Gate::define('viewApiDocs', function ($user = null) {
            // Allow access in local environment or if user is Admin/SuperAdmin
            return app()->environment('local') || ($user && $user->hasRole('Admin'));
        });

        \Dedoc\Scramble\Scramble::afterOpenApiGenerated(function (\Dedoc\Scramble\Support\Generator\OpenApi $openApi) {
            $openApi->secure(
                \Dedoc\Scramble\Support\Generator\SecurityScheme::http('bearer')
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
        \Illuminate\Support\Facades\RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->email ?: $request->ip());
        });

        \Illuminate\Support\Facades\RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()->id);
        });
    }
}
