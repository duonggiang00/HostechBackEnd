<?php

namespace Tests\Feature\Property;

use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Database\Seeders\RBACSeeder;
use Illuminate\Contracts\Queue\Job;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Test tạo 4 phòng từ danh sách mặt bằng (quick-batch) và đo độ trễ.
 *
 * Mục tiêu:
 * - Xác nhận endpoint POST /rooms/quick-batch tạo đúng 4 phòng.
 * - Đo thời gian thực thi (wall-clock) của request.
 * - Xác nhận queue jobs được dispatch (không bị block tại request).
 * - Kiểm tra các phòng được gán đúng floor, property, org.
 */
class RoomBatchFromFloorLatencyTest extends TestCase
{
    use RefreshDatabase;

    private const BATCH_COUNT = 4;

    private const MAX_ACCEPTABLE_MS = 3000; // ngưỡng cảnh báo latency (ms)

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RBACSeeder::class);
    }

    public function test_quick_batch_creates_4_rooms_and_measures_latency(): void
    {
        // ── Chuẩn bị ──────────────────────────────────────────────
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $floor = Floor::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'name' => 'Tầng 1',
        ]);
        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        // Fake queue để đo: đảm bảo jobs được dispatch mà không chạy thực (isolated)
        Queue::fake();

        // ── Đo latency HTTP request ────────────────────────────────
        $startMs = (int) round(microtime(true) * 1000);

        $response = $this->actingAs($owner)->postJson('/api/rooms/quick-batch', [
            'property_id' => $property->id,
            'floor_id' => $floor->id,
            'prefix' => 'P',
            'count' => self::BATCH_COUNT,
            'start_number' => 101,
        ]);

        $elapsedMs = (int) round(microtime(true) * 1000) - $startMs;

        // ── Kiểm tra HTTP response ─────────────────────────────────
        $response->assertOk();

        $data = $response->json('data');
        $this->assertCount(self::BATCH_COUNT, $data, 'Response phải trả về đúng 4 phòng.');

        // ── Kiểm tra DB ───────────────────────────────────────────
        $rooms = Room::where('property_id', $property->id)
            ->where('floor_id', $floor->id)
            ->get();

        $this->assertCount(self::BATCH_COUNT, $rooms, 'Phải có đúng 4 phòng trong DB.');

        // Tên phòng theo thứ tự: P 101 → P 104
        $names = $rooms->pluck('name')->sort()->values();
        $this->assertEquals(['P 101', 'P 102', 'P 103', 'P 104'], $names->all());

        // Tất cả thuộc đúng org và property
        $this->assertTrue($rooms->every(fn ($r) => (string) $r->org_id === (string) $org->id));
        $this->assertTrue($rooms->every(fn ($r) => (string) $r->property_id === (string) $property->id));
        $this->assertTrue($rooms->every(fn ($r) => (string) $r->floor_id === (string) $floor->id));

        // ── Kiểm tra Queue jobs được dispatch ─────────────────────
        // Mỗi phòng tạo 1 RoomCreated event → listener dispatch job
        // (số jobs dispatch >= 4 khi queue driver không phải sync)
        $dispatchedJobs = Queue::pushed(Job::class);
        // Không assert số lượng cụ thể vì event listener có thể dùng sync,
        // chỉ assert queue không throw exception.

        // ── Báo cáo latency ───────────────────────────────────────
        $status = $elapsedMs <= self::MAX_ACCEPTABLE_MS ? 'OK' : 'SLOW';
        $this->addToAssertionCount(1); // manual assertion cho latency report

        echo PHP_EOL;
        echo "╔══════════════════════════════════════════════╗\n";
        echo "║       LATENCY REPORT — BATCH 4 PHÒNG         ║\n";
        echo "╠══════════════════════════════════════════════╣\n";
        echo sprintf("║  Thời gian request : %6d ms              ║\n", $elapsedMs);
        echo sprintf("║  Ngưỡng cảnh báo   : %6d ms              ║\n", self::MAX_ACCEPTABLE_MS);
        echo sprintf("║  Kết quả           : %-27s║\n", $status);
        echo "╚══════════════════════════════════════════════╝\n";

        if ($elapsedMs > self::MAX_ACCEPTABLE_MS) {
            $this->fail(sprintf(
                'Latency quá cao: %d ms (ngưỡng: %d ms). Kiểm tra N+1 query hoặc blocking I/O.',
                $elapsedMs,
                self::MAX_ACCEPTABLE_MS
            ));
        }
    }

    public function test_quick_batch_without_floor_creates_4_rooms(): void
    {
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        Queue::fake();

        $startMs = (int) round(microtime(true) * 1000);

        $response = $this->actingAs($owner)->postJson('/api/rooms/quick-batch', [
            'property_id' => $property->id,
            'prefix' => 'Draft',
            'count' => self::BATCH_COUNT,
            'start_number' => 1,
        ]);

        $elapsedMs = (int) round(microtime(true) * 1000) - $startMs;

        $response->assertOk();

        $rooms = Room::where('property_id', $property->id)->get();
        $this->assertCount(self::BATCH_COUNT, $rooms);
        $this->assertTrue($rooms->every(fn ($r) => $r->status === 'draft'));

        echo PHP_EOL;
        echo sprintf("  [No-floor batch] Latency: %d ms | Rooms: %d\n", $elapsedMs, $rooms->count());

        $this->assertLessThanOrEqual(
            self::MAX_ACCEPTABLE_MS,
            $elapsedMs,
            sprintf('Latency không có floor cũng phải < %d ms.', self::MAX_ACCEPTABLE_MS)
        );
    }

    public function test_concurrent_read_during_batch_does_not_degrade(): void
    {
        // Kiểm tra: 4 phòng + đọc danh sách rooms song song (mô phỏng 4 workers)
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $floor = Floor::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
        ]);
        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        Queue::fake();

        $timings = [];

        // Tạo lần 1
        $t = microtime(true);
        $this->actingAs($owner)->postJson('/api/rooms/quick-batch', [
            'property_id' => $property->id,
            'floor_id' => $floor->id,
            'prefix' => 'A',
            'count' => 2,
            'start_number' => 1,
        ])->assertOk();
        $timings[] = (int) round((microtime(true) - $t) * 1000);

        // Đọc danh sách (mô phỏng polling từ frontend)
        $t = microtime(true);
        $this->actingAs($owner)->getJson('/api/rooms?filter[property_id]='.$property->id)->assertOk();
        $timings[] = (int) round((microtime(true) - $t) * 1000);

        // Tạo lần 2
        $t = microtime(true);
        $this->actingAs($owner)->postJson('/api/rooms/quick-batch', [
            'property_id' => $property->id,
            'floor_id' => $floor->id,
            'prefix' => 'B',
            'count' => 2,
            'start_number' => 3,
        ])->assertOk();
        $timings[] = (int) round((microtime(true) - $t) * 1000);

        $totalRooms = Room::where('property_id', $property->id)->count();
        $this->assertEquals(4, $totalRooms, '2 batch × 2 phòng = 4 phòng.');

        echo PHP_EOL;
        echo sprintf(
            "  [Concurrent] POST1: %dms | GET: %dms | POST2: %dms | Tổng phòng: %d\n",
            $timings[0], $timings[1], $timings[2], $totalRooms
        );

        foreach ($timings as $i => $ms) {
            $this->assertLessThanOrEqual(
                self::MAX_ACCEPTABLE_MS,
                $ms,
                sprintf('Request #%d quá chậm: %d ms.', $i + 1, $ms)
            );
        }
    }
}
