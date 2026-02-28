<?php

namespace App\Actions\Fortify;

use App\Models\Org\User;
use App\Models\Org\Org;
use App\Services\System\UserInvitationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    public function __construct(
        protected UserInvitationService $invitationService
    ) {}

    /**
     * Validate and create a newly registered user from an invite token.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'invite_token' => ['required', 'string'],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class, 'email'),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => $this->passwordRules(),
            // Only required if the invitation is for an Owner to create a new Org
            'org_name' => ['nullable', 'string', 'max:255'],
            'org_phone' => ['nullable', 'string', 'max:30'],
        ])->validate();

        // 1. Validate the Invitation
        $invitation = $this->invitationService->validateToken($input['invite_token']);

        if ($invitation->email !== $input['email']) {
            throw new \Exception("The registration email must match the invited email.");
        }

        return DB::transaction(function () use ($input, $invitation) {
            $orgId = $invitation->org_id;

            // 2. Handle Org Creation for Owners
            if (is_null($orgId) && $invitation->role_name === 'Owner') {
                if (empty($input['org_name'])) {
                    throw new \InvalidArgumentException("org_name is required when creating an Owner account.");
                }
                
                $org = Org::create([
                    'name' => $input['org_name'],
                    'phone' => $input['org_phone'] ?? null,
                    'email' => $input['email'], // Using owner's email for Org default
                ]);
                
                $orgId = $org->id;
            }

            // 3. Create the User
            $user = User::create([
                'org_id' => $orgId,
                'full_name' => $input['full_name'],
                'email' => $input['email'],
                'phone' => $input['phone'] ?? null,
                'password_hash' => Hash::make($input['password']),
                'email_verified_at' => now(), // Assume verified since they received the email link
                'is_active' => true,
            ]);

            // 4. Assign Role
            $user->assignRole($invitation->role_name);

            // 5. Assign Property Scopes (for Manager/Staff)
            if (!empty($invitation->properties_scope)) {
                $user->properties()->sync($invitation->properties_scope);
            }

            // 6. Mark invitation as used
            $invitation->update(['registered_at' => now()]);

            return $user;
        });
    }
}
