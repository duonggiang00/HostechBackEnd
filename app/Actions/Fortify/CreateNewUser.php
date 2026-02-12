<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
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
        ])->validate();

        $user = User::create([
            'full_name' => $input['full_name'],
            'email' => $input['email'],
            'phone' => $input['phone'] ?? null,
            'password_hash' => Hash::make($input['password']),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);

        // Securely assign the default role for public registration
        $user->assignRole('Tenant');

        return $user;
    }
}
