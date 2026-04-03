<?php

namespace Database\Factories\System;

use App\Features\System\Models\VerificationCode;
use Illuminate\Database\Eloquent\Factories\Factory;

class VerificationCodeFactory extends Factory
{
    protected $model = VerificationCode::class;

    public function definition(): array
    {
        return [
            'email' => $this->faker->unique()->safeEmail(),
            'code' => str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'type' => 'mfa_otp',
            'expires_at' => now()->addMinutes(10),
            'used_at' => null,
        ];
    }
}
