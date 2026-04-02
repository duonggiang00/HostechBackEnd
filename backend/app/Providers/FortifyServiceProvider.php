<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Actions\Fortify\UpdateUserPassword;
use App\Actions\Fortify\UpdateUserProfileInformation;
use App\Http\Responses\Auth\LoginResponse;
use App\Http\Responses\Auth\RegisterResponse;
use App\Http\Responses\Auth\TwoFactorChallengeResponse;
use App\Http\Responses\Auth\TwoFactorLoginResponse;
use App\Features\Org\Models\User;
use App\Http\Responses\Auth\LogoutResponse;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\ServiceProvider;
use App\Actions\Fortify\RedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Contracts\TwoFactorChallengeResponse as TwoFactorChallengeResponseContract;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider as TwoFactorAuthenticationProviderContract;
use App\Providers\Auth\TwoFactorAuthenticationProvider;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind custom response classes
        $this->app->singleton(LoginResponseContract::class, LoginResponse::class);
        $this->app->singleton(LogoutResponseContract::class, LogoutResponse::class);
        $this->app->singleton(RegisterResponseContract::class, RegisterResponse::class);
        $this->app->singleton(TwoFactorChallengeResponseContract::class, TwoFactorChallengeResponse::class);
        $this->app->singleton(TwoFactorLoginResponseContract::class, TwoFactorLoginResponse::class);
        $this->app->singleton(TwoFactorAuthenticationProviderContract::class, TwoFactorAuthenticationProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register actions
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::updateUserProfileInformationUsing(UpdateUserProfileInformation::class);
        Fortify::updateUserPasswordsUsing(UpdateUserPassword::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::redirectUserForTwoFactorAuthenticationUsing(RedirectIfTwoFactorAuthenticatable::class);

        // Custom authentication pipeline to check is_active status
        Fortify::authenticateUsing(function (\Illuminate\Http\Request $request) {
            $user = User::where('email', $request->email)->first();

            // Check if user exists, password is correct, and account is active
            if (
                $user &&
                Hash::check($request->password, $user->password_hash) &&
                $user->is_active
            ) {
                return $user;
            }

            return null;
        });
    }
}
