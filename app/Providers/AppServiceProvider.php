<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
        $this->configureRateLimiting();

        \Illuminate\Support\Facades\Gate::define('viewApiDocs', function ($user = null) {
            // Allow access in local environment or if user is Admin/SuperAdmin
            return app()->environment('local') || ($user && ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')));
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
                        'Authentication' // Default tag if using AuthenticationController
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
