<?php

namespace App\Actions\Fortify;

use App\Models\Org\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\UpdatesUserProfileInformation;

class UpdateUserProfileInformation implements UpdatesUserProfileInformation
{
    /**
     * Validate and update the given user's profile information.
     *
     * @param  array<string, string>  $input
     */
    public function update(User $user, array $input): void
    {
        Validator::make($input, [
            'full_name'             => ['required', 'string', 'max:255'],
            'email'                 => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone'                 => ['nullable', 'string', 'max:30'],
            'identity_number'       => ['nullable', 'string', 'max:20'],
            'identity_issued_date'  => ['nullable', 'date'],
            'identity_issued_place' => ['nullable', 'string', 'max:255'],
            'date_of_birth'         => ['nullable', 'date'],
            'address'               => ['nullable', 'string', 'max:500'],
        ])->validateWithBag('updateProfileInformation');

        $user->forceFill([
            'full_name'             => $input['full_name'],
            'email'                 => $input['email'],
            'phone'                 => $input['phone'] ?? $user->phone,
            'identity_number'       => $input['identity_number'] ?? $user->identity_number,
            'identity_issued_date'  => $input['identity_issued_date'] ?? $user->identity_issued_date,
            'identity_issued_place' => $input['identity_issued_place'] ?? $user->identity_issued_place,
            'date_of_birth'         => $input['date_of_birth'] ?? $user->date_of_birth,
            'address'               => $input['address'] ?? $user->address,
        ])->save();
    }
}
