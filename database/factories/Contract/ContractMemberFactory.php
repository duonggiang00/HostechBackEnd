<?php

namespace Database\Factories\Contract;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Contract\ContractMember>
 */
class ContractMemberFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'org_id' => \App\Models\Org\Org::factory(),
            'contract_id' => \App\Models\Contract\Contract::factory(),
            'user_id' => \App\Models\Org\User::factory(),
            'role' => $this->faker->randomElement(['TENANT', 'ROOMMATE', 'GUARANTOR']),
            'is_primary' => false,
            'joined_at' => now(),
            'left_at' => null,
        ];
    }

    public function configure()
    {
        return $this->afterMaking(function (\App\Models\Contract\ContractMember $member) {
            if ($member->contract) {
                $member->org_id = $member->contract->org_id;
            }
        });
    }
}
