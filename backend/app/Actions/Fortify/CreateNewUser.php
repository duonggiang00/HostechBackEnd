<?php

namespace App\Actions\Fortify;

use App\Models\Org\Org;
use App\Models\Org\User;
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
            // Identity fields
            'identity_number' => ['nullable', 'string', 'max:30'],
            'identity_issued_date' => ['nullable', 'date'],
            'identity_issued_place' => ['nullable', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
            'license_plate' => ['nullable', 'string', 'max:20'],
            // Only required if the invitation is for an Owner to create a new Org
            'org_name' => ['nullable', 'string', 'max:255'],
            'org_phone' => ['nullable', 'string', 'max:30'],
        ])->validate();

        // 1. Validate the Invitation
        $invitation = $this->invitationService->validateToken($input['invite_token']);

        if ($invitation->email !== $input['email']) {
            throw new \Exception('The registration email must match the invited email.');
        }

        return DB::transaction(function () use ($input, $invitation) {
            $orgId = $invitation->org_id;

            // 2. Handle Org Creation for Owners
            if (is_null($orgId) && $invitation->role_name === 'Owner') {
                if (empty($input['org_name'])) {
                    throw new \InvalidArgumentException('org_name is required when creating an Owner account.');
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
                // Identity / Personal
                'identity_number' => $input['identity_number'] ?? null,
                'identity_issued_date' => $input['identity_issued_date'] ?? null,
                'identity_issued_place' => $input['identity_issued_place'] ?? null,
                'date_of_birth' => $input['date_of_birth'] ?? null,
                'address' => $input['address'] ?? null,
                'license_plate' => $input['license_plate'] ?? null,
            ]);

            // 4. Assign Role
            $user->assignRole($invitation->role_name);

            // 5. Assign Property Scopes (for Manager/Staff)
            if (! empty($invitation->properties_scope)) {
                $user->properties()->sync($invitation->properties_scope);
            }

            // 6. Mark invitation as used
            $invitation->update(['registered_at' => now()]);

            // 7. Backfill contract_members — Path B: email stored in contract_members
            //    email + org_id + status cho phép định danh chính xác, không cần FK phụ.
            \App\Models\Contract\ContractMember::where('email', $invitation->email)
                ->where('org_id', $orgId)
                ->where('status', 'PENDING_INVITE')
                ->whereNull('user_id')
                ->update([
                    'user_id' => $user->id,
                    'status'  => 'PENDING',  // cần ký e-signature
                ]);

            return $user;
        });
    }
}
