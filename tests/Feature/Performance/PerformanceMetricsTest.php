<?php

namespace Tests\Feature\Performance;

use App\Models\Performance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PerformanceMetricsTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function index_metrics_include_only_last_thirty_days(): void
    {
        $now = Carbon::create(2025, 1, 15, 12, 0, 0);
        Carbon::setTestNow($now);

        $user = User::factory()->create();
        $this->givePermissions($user, [
            'performances.view',
            'performances.view-any',
            'performances.show',
        ]);

        Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(10),
            'satus' => 'active',
        ]);

        Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(5),
            'satus' => 'completed',
        ]);

        Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(1),
            'satus' => 'failed',
        ]);

        Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(45),
            'satus' => 'completed',
        ]);

        $this->actingAs($user)
            ->get(route('performances.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Performances/Index')
                ->where('metrics.total', 3)
                ->where('metrics.active', 1)
                ->where('metrics.completed', 1)
                ->where('metrics.failed', 1)
            );

        Carbon::setTestNow();
    }

    #[Test]
    public function index_lists_latest_dispatch_first_by_default(): void
    {
        $now = Carbon::create(2025, 2, 1, 8, 30, 0);
        Carbon::setTestNow($now);

        $user = User::factory()->create();
        $this->givePermissions($user, [
            'performances.view',
            'performances.view-any',
            'performances.show',
        ]);

        $oldest = Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(25),
            'satus' => 'completed',
        ]);

        $middle = Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(7),
            'satus' => 'active',
        ]);

        $latest = Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(1),
            'satus' => 'failed',
        ]);

        $this->actingAs($user)
            ->get(route('performances.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Performances/Index')
                ->where('performances.data.0.id', $latest->id)
                ->where('performances.data.1.id', $middle->id)
                ->where('performances.data.2.id', $oldest->id)
            );

        Carbon::setTestNow();
    }
}
