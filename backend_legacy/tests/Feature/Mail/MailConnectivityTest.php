<?php

namespace Tests\Feature\Mail;

use App\Mail\Auth\OTPMail;
use App\Mail\System\UserInvitationMail;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\System\UserInvitation;
use App\Services\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MailConnectivityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['auth.defaults.guard' => 'web']);
        
        // Disable activity logging for tests to avoid missing table issues
        config(['activitylog.enabled' => false]);
        
        // Ensure core roles exist
        Role::create(['name' => 'Admin', 'guard_name' => 'web']);
        Role::create(['name' => 'Manager', 'guard_name' => 'web']);
        Role::create(['name' => 'Tenant', 'guard_name' => 'web']);
    }

    protected function tearDown(): void
    {
        TenantManager::setOrgId(null);
        parent::tearDown();
    }

    /**
     * Test that OTPMail can be rendered and "sent" via fake.
     */
    public function test_otp_mail_rendering()
    {
        Mail::fake();

        $code = '123456';
        $mailable = new OTPMail($code);

        $mailable->assertHasSubject('Mã xác thực OTP của bạn - Hostech');
        $mailable->assertSeeInHtml($code);

        Mail::to('test@example.com')->send($mailable);

        Mail::assertSent(OTPMail::class, function ($mail) use ($code) {
            return $mail->code === $code && $mail->hasTo('test@example.com');
        });
    }

    /**
     * Test that UserInvitationMail (Account/Contract) renders correctly.
     */
    public function test_user_invitation_mail_rendering()
    {
        Mail::fake();

        $invitation = UserInvitation::factory()->create([
            'email' => 'invitee@example.com',
            'role_name' => 'Tenant',
            'token' => 'test-token-123',
        ]);

        $mailable = new UserInvitationMail($invitation);

        $mailable->assertHasSubject('Lời mời tham gia hệ thống Hostech');
        $mailable->assertSeeInHtml('test-token-123');
        $mailable->assertSeeInHtml('Tenant');

        Mail::to($invitation->email)->send($mailable);

        Mail::assertSent(UserInvitationMail::class, function ($mail) use ($invitation) {
            return $mail->invitation->id === $invitation->id && $mail->hasTo('invitee@example.com');
        });
    }

    /**
     * Test that MFA service correctly sends OTP.
     */
    public function test_mfa_service_sends_otp()
    {
        Mail::fake();
        
        // Mock the Fortify provider needed by MfaService
        $mockProvider = \Mockery::mock(\Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider::class);
        $this->app->instance(\Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider::class, $mockProvider);

        $user = User::factory()->create(['email' => 'user@example.com']);
        $mfaService = app(\App\Services\Auth\MfaService::class);

        $mfaService->sendEmailOtp($user);

        Mail::assertSent(OTPMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    /**
     * Test Admin inviting a Manager.
     */
    public function test_admin_inviting_manager_sends_email()
    {
        Mail::fake();

        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $inviter = User::factory()->create(['org_id' => $org->id]);
        $inviter->assignRole('Admin');
        
        $this->actingAs($inviter);

        $invitationService = app(\App\Services\System\UserInvitationService::class);

        $invitationService->createInvite($inviter, [
            'email' => 'manager@example.com',
            'role_name' => 'Manager',
            'org_id' => $org->id,
        ]);

        Mail::assertQueued(UserInvitationMail::class, function ($mail) {
            return $mail->hasTo('manager@example.com');
        });
    }

    /**
     * Test Manager inviting a Tenant (Contract flow).
     */
    public function test_manager_inviting_tenant_details_sends_email()
    {
        Mail::fake();

        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $property = Property::factory()->create(['org_id' => $org->id]);
        
        $inviter = User::factory()->create(['org_id' => $org->id]);
        $inviter->assignRole('Manager');
        $inviter->properties()->attach($property->id);
        
        $this->actingAs($inviter);

        $invitationService = app(\App\Services\System\UserInvitationService::class);

        $invitationService->createInvite($inviter, [
            'email' => 'tenant@example.com',
            'role_name' => 'Tenant',
            'org_id' => $org->id,
            'properties_scope' => [$property->id],
        ]);

        Mail::assertQueued(UserInvitationMail::class, function ($mail) {
            return $mail->hasTo('tenant@example.com');
        });
    }
}
