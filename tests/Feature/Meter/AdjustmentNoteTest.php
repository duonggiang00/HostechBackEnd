<?php

namespace Tests\Feature\Meter;

use App\Models\Meter\AdjustmentNote;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Org\Org;
use App\Models\Org\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdjustmentNoteTest extends TestCase
{
    // Use RefreshDatabase if using in-memory testing DB. Assuming hostech uses test DB configs.
    // use RefreshDatabase; 

    protected $user;
    protected $org;
    protected $property;
    protected $room;
    protected $meter;
    protected $lockedReading;
    protected $unlockedReading;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->org = Org::factory()->create();
        
        $this->property = \App\Models\Property\Property::factory()->create(['org_id' => $this->org->id]);
        $this->room = \App\Models\Property\Room::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $this->property->id,
        ]);

        $this->meter = Meter::factory()->create([
            'org_id' => $this->org->id,
            'room_id' => $this->room->id,
        ]);

        $this->lockedReading = MeterReading::factory()->create([
            'org_id' => $this->org->id,
            'meter_id' => $this->meter->id,
            'period_start' => now()->subMonth()->startOfMonth()->format('Y-m-d'),
            'period_end' => now()->subMonth()->endOfMonth()->format('Y-m-d'),
            'reading_value' => 1000,
            'status' => 'APPROVED',
            'locked_at' => now(), // MUST BE LOCKED
        ]);
        
        $this->unlockedReading = MeterReading::factory()->create([
            'org_id' => $this->org->id,
            'meter_id' => $this->meter->id,
            'period_start' => now()->startOfMonth()->format('Y-m-d'),
            'period_end' => now()->endOfMonth()->format('Y-m-d'),
            'reading_value' => 1500,
            'status' => 'PENDING',
            'locked_at' => null, // UNLOCKED
        ]);
    }

    public function test_can_create_adjustment_note_for_locked_reading()
    {
        $response = $this->actingAs($this->user)->postJson(
            "/api/meter-readings/{$this->lockedReading->id}/adjustments",
            [
                'reason' => 'Mistyped the reading',
                'after_value' => 1050,
                // Assuming we don't strictly require valid TemporaryUpload records 
                // for standard request testing, or we mock it. 
                // Removing proof_media_ids here to avoid foreign key failures on temporary uploads mock if lacking.
                // In full integration tests, we'd create a mock temporary upload 
            ]
        );

        // This might fail validation if we strictly enforce temporary uploads existent IDs.
        // If it returns 422 because of proof_media_ids, it means validation is active.
        if ($response->status() === 422) {
             // Let's create a temporary upload mock
             Storage::fake('local');
             $file = UploadedFile::fake()->image('proof.jpg');
             
             $tempUpload = \App\Models\System\TemporaryUpload::factory()->create();

             $response = $this->actingAs($this->user)->postJson(
                "/api/meter-readings/{$this->lockedReading->id}/adjustments",
                [
                    'reason' => 'Mistyped the reading',
                    'after_value' => 1050,
                    'proof_media_ids' => [$tempUpload->id]
                ]
            );
        }

        $response->assertStatus(201)
                 ->assertJsonPath('data.status', 'PENDING')
                 ->assertJsonPath('data.before_value', 1000)
                 ->assertJsonPath('data.after_value', 1050);

        $this->assertDatabaseHas('adjustment_notes', [
            'meter_reading_id' => $this->lockedReading->id,
            'status' => 'PENDING',
        ]);
    }

    public function test_cannot_create_adjustment_note_for_unlocked_reading()
    {
        Storage::fake('local');
        $file = UploadedFile::fake()->image('proof.jpg');

        $tempUpload = \App\Models\System\TemporaryUpload::factory()->create();
        
        $response = $this->actingAs($this->user)->postJson(
            "/api/meter-readings/{$this->unlockedReading->id}/adjustments",
            [
                'reason' => 'Mistyped the reading',
                'after_value' => 1050,
                'proof_media_ids' => [$tempUpload->id]
            ]
        );

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('reading');
    }

    public function test_can_approve_adjustment_note()
    {
        $note = AdjustmentNote::factory()->create([
            'org_id' => $this->org->id,
            'meter_reading_id' => $this->lockedReading->id,
            'before_value' => 1000,
            'after_value' => 1200,
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($this->user)->putJson(
            "/api/meter-readings/{$this->lockedReading->id}/adjustments/{$note->id}/approve"
        );

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'APPROVED');

        // Check DB hooks
        $this->assertDatabaseHas('adjustment_notes', [
            'id' => $note->id,
            'status' => 'APPROVED',
            'approved_by_user_id' => $this->user->id,
        ]);

        $this->assertDatabaseHas('meter_readings', [
            'id' => $this->lockedReading->id,
            'reading_value' => 1200, // Important: Value overwritten
        ]);
    }

    public function test_can_reject_adjustment_note()
    {
        $note = AdjustmentNote::factory()->create([
            'org_id' => $this->org->id,
            'meter_reading_id' => $this->lockedReading->id,
            'before_value' => 1000,
            'after_value' => 1200,
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($this->user)->putJson(
            "/api/meter-readings/{$this->lockedReading->id}/adjustments/{$note->id}/reject",
            [
                'reject_reason' => 'Proof image is blurry'
            ]
        );

        $response->assertStatus(200)
                 ->assertJsonPath('data.status', 'REJECTED');

        // Check DB hooks
        $this->assertDatabaseHas('adjustment_notes', [
            'id' => $note->id,
            'status' => 'REJECTED',
            'reject_reason' => 'Proof image is blurry',
            'rejected_by_user_id' => $this->user->id,
        ]);

        // Original value should remain untouched
        $this->assertDatabaseHas('meter_readings', [
            'id' => $this->lockedReading->id,
            'reading_value' => 1000, 
        ]);
    }
}
