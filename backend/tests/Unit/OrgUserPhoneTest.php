<?php

namespace Tests\Unit;

use App\Models\Org\Org;
use App\Models\Org\User;
use App\Support\OrgUserPhone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrgUserPhoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_normalize_converts_vietnam_country_code_to_leading_zero(): void
    {
        $this->assertSame('0987654321', OrgUserPhone::normalize('84987654321'));
        $this->assertSame('0987654321', OrgUserPhone::normalize('0987654321'));
    }

    public function test_find_conflicting_user_returns_null_when_same_email_as_existing_phone_owner(): void
    {
        $org = Org::factory()->create();
        User::factory()->create([
            'org_id' => $org->id,
            'email' => 'same@example.com',
            'phone' => '0912345678',
        ]);

        $this->assertNull(
            OrgUserPhone::findConflictingUserInOrg((string) $org->id, '0912345678', 'same@example.com')
        );
    }

    public function test_find_conflicting_user_when_phone_taken_by_different_email(): void
    {
        $org = Org::factory()->create();
        $existing = User::factory()->create([
            'org_id' => $org->id,
            'email' => 'first@example.com',
            'phone' => '0912345678',
        ]);

        $conflict = OrgUserPhone::findConflictingUserInOrg((string) $org->id, '0912345678', 'second@example.com');

        $this->assertNotNull($conflict);
        $this->assertSame((string) $existing->id, (string) $conflict->id);
    }

    public function test_find_conflicting_user_when_phone_set_but_no_email_in_payload(): void
    {
        $org = Org::factory()->create();
        $existing = User::factory()->create([
            'org_id' => $org->id,
            'email' => 'owner@example.com',
            'phone' => '0912345678',
        ]);

        $conflict = OrgUserPhone::findConflictingUserInOrg((string) $org->id, '0912345678', null);

        $this->assertNotNull($conflict);
        $this->assertSame((string) $existing->id, (string) $conflict->id);
    }
}
