<?php

namespace Database\Factories\Org;

use App\Features\Org\Models\Org;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrgFactory extends Factory
{
    protected $model = Org::class;

    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'name' => fake('vi_VN')->company(),
            'phone' => fake('vi_VN')->phoneNumber(),
            'email' => fake('vi_VN')->companyEmail(),
            'address' => fake('vi_VN')->address(),
            'timezone' => 'Asia/Bangkok',
            'currency' => 'VND',
        ];
    }
}
