<?php

namespace Database\Factories\System;

use App\Models\Org\User;
use App\Models\System\TemporaryUpload;
use Illuminate\Database\Eloquent\Factories\Factory;

class TemporaryUploadFactory extends Factory
{
    protected $model = TemporaryUpload::class;

    public function definition(): array
    {
        return [
            'id' => $this->faker->uuid(),
            'user_id' => User::inRandomOrder()->first()->id ?? User::factory(),
        ];
    }
}
