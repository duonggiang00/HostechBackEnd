<?php

namespace Tests\Feature\Meter;

use App\Models\Meter\Meter;
use App\Models\System\TemporaryUpload;
use App\Models\Org\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MeterMediaTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RBACSeeder::class);
        $org = \App\Models\Org\Org::factory()->create();
        \App\Services\TenantManager::setOrgId($org->id);
        $this->user = User::factory()->owner()->create(['org_id' => $org->id]);
        $this->actingAs($this->user);
    }

    public function test_can_create_meter_with_media()
    {
        Storage::fake('local');
        
        $property = \App\Models\Property\Property::factory()->create(['org_id' => $this->user->org_id]);
        $room = \App\Models\Property\Room::factory()->create([
            'org_id' => $this->user->org_id,
            'property_id' => $property->id
        ]);

        // 1. Prepare a temporary upload
        $file = UploadedFile::fake()->image('meter_photo.jpg');
        $tempUpload = TemporaryUpload::create(['user_id' => $this->user->id]);
        $tempUpload->addMedia($file)->toMediaCollection('default');

        // 2. Create meter with this media_id
        $data = [
            'org_id' => $this->user->org_id,
            'room_id' => $room->id,
            'code' => 'TEST-METER-MEDIA',
            'type' => 'ELECTRIC',
            'media_ids' => [$tempUpload->id],
        ];

        $response = $this->postJson("/api/meters", $data);

        $response->assertStatus(201);
        $meterId = $response->json('data.id');
        $meter = Meter::find($meterId);

        // 3. Verify media was attached
        $this->assertCount(1, $meter->getMedia('meter_attachments'));
        $this->assertEquals('meter_photo.jpg', $meter->getFirstMedia('meter_attachments')->file_name);
        
        // 4. Verify Resource includes media
        $response->assertJsonPath('data.media.0.name', 'meter_photo.jpg');
    }

    public function test_can_add_media_to_existing_meter()
    {
        Storage::fake('local');
        $property = \App\Models\Property\Property::factory()->create(['org_id' => $this->user->org_id]);
        $meter = Meter::factory()->create([
            'org_id' => $this->user->org_id,
            'property_id' => $property->id
        ]);

        $file = UploadedFile::fake()->image('update_photo.jpg');
        $tempUpload = TemporaryUpload::create(['user_id' => $this->user->id]);
        $tempUpload->addMedia($file)->toMediaCollection('default');

        $response = $this->putJson("/api/meters/{$meter->id}", [
            'media_ids' => [$tempUpload->id]
        ]);

        $response->assertStatus(200);
        $this->assertCount(1, $meter->fresh()->getMedia('meter_attachments'));
    }
}
