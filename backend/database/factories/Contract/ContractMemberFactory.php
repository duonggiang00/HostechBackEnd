<?php

namespace Database\Factories\Contract;

use App\Features\Contract\Models\Contract;
use App\Features\Contract\Models\ContractMember;
use App\Features\Org\Models\Org;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Features\Contract\Models\ContractMember>
 */
class ContractMemberFactory extends Factory
{
    protected $model = ContractMember::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'org_id' => Org::factory(),
            'contract_id' => Contract::factory(),
            'user_id' => null, // Default to no user created
            'full_name' => fake('vi_VN')->name(),
            'phone' => fake('vi_VN')->phoneNumber(),
            'identity_number' => fake()->numerify('0010#########'), // Fake Vietnamese CCCD
            'role' => $this->faker->randomElement(['TENANT', 'ROOMMATE', 'GUARANTOR']),
            'status' => 'APPROVED',
            'is_primary' => false,
            'joined_at' => now(),
            'left_at' => null,
        ];
    }

    public function configure()
    {
        return $this->afterMaking(function (ContractMember $member) {
            if ($member->contract) {
                $member->org_id = $member->contract->org_id;
            }
        });
    }
}
