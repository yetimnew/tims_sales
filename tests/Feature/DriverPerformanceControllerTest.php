<?php

namespace Tests\Feature;

use App\Models\DriverPerformanceRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DriverPerformanceControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, ['driver-performance.view']);
    }

    #[Test]
    public function it_lists_driver_performance_records_newest_first(): void
    {
        $olderRecord = DriverPerformanceRecord::factory()->create([
            'created_at' => now()->subWeeks(2),
            'record_date' => now()->subWeeks(2),
        ]);
        $newerRecord = DriverPerformanceRecord::factory()->create([
            'created_at' => now()->subWeek(),
            'record_date' => now()->subWeek(),
        ]);
        $latestRecord = DriverPerformanceRecord::factory()->create([
            'created_at' => now(),
            'record_date' => now(),
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('driver-performance.index'));

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('DriverPerformance/Index')
                ->has('performanceRecords.data', 3)
                ->where('performanceRecords.data.0.id', $latestRecord->id)
                ->where('performanceRecords.data.1.id', $newerRecord->id)
                ->where('performanceRecords.data.2.id', $olderRecord->id)
            );
    }
}
