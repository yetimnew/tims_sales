<?php

namespace Tests\Feature;

use App\Events\OutsourcePerformanceCreated;
use App\Events\OutsourcePerformanceDeleted;
use App\Events\OutsourcePerformanceUpdated;
use App\Models\Operation;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OutsourcePerformanceControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'outsource-performances.view',
            'outsource-performances.view-any',
            'outsource-performances.view-own',
            'outsource-performances.store',
            'outsource-performances.update',
            'outsource-performances.destroy',
        ]);
    }

    #[Test]
    public function it_lists_outsource_performances_without_filters(): void
    {
        $performance = OutsourcePerformance::factory()->create([
            'status' => 'active',
        ]);

        $this->actingAs($this->user)
            ->get(route('outsource-performances.index'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('OutsourcePerformances/Index')
                ->where('outsourcePerformances.total', 1)
                ->where('outsourcePerformances.data.0.id', $performance->id)
            );
    }

    #[Test]
    public function it_dispatches_event_when_outsource_performance_is_created(): void
    {
        Event::fake([
            OutsourcePerformanceCreated::class,
        ]);

        $outsource = Outsource::factory()->create();
        $operation = Operation::factory()->create();
        $fromPlace = Place::factory()->create();
        $toPlace = Place::factory()->create();

        $response = $this->actingAs($this->user)
            ->post(route('outsource-performances.store'), [
                'outsource_id' => $outsource->id,
                'operation_id' => $operation->id,
                'trip_number' => 'OUT-TRIP-001',
                'dispatch_date' => now()->toDateString(),
                'from_place_id' => $fromPlace->id,
                'to_place_id' => $toPlace->id,
                'distance_km' => 120.5,
                'cargo_volume_mt' => 40.0,
                'tonkm' => null,
                'cost' => 15000.0,
                'remarks' => 'Initial dispatch',
                'status' => 'active',
            ]);

        $response->assertRedirect(route('outsource-performances.index'));
        $response->assertSessionHas('success', 'Outsource performance created successfully.');

        Event::assertDispatched(OutsourcePerformanceCreated::class, function (OutsourcePerformanceCreated $event) use ($outsource): bool {
            return $event->performance->outsource_id === $outsource->id;
        });
    }

    #[Test]
    public function it_dispatches_event_when_outsource_performance_is_updated(): void
    {
        Event::fake([
            OutsourcePerformanceUpdated::class,
        ]);

        $performance = OutsourcePerformance::factory()->create([
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('outsource-performances.update', $performance), [
                'outsource_id' => $performance->outsource_id,
                'operation_id' => $performance->operation_id,
                'trip_number' => $performance->trip_number,
                'dispatch_date' => optional($performance->dispatch_date)->toDateString() ?? now()->toDateString(),
                'from_place_id' => $performance->from_place_id,
                'to_place_id' => $performance->to_place_id,
                'distance_km' => $performance->distance_km,
                'cargo_volume_mt' => $performance->cargo_volume_mt,
                'tonkm' => $performance->tonkm,
                'cost' => $performance->cost,
                'remarks' => 'Updated remarks',
                'status' => 'completed',
            ]);

        $response->assertRedirect(route('outsource-performances.index'));
        $response->assertSessionHas('success', 'Outsource performance updated successfully.');

        Event::assertDispatched(OutsourcePerformanceUpdated::class, function (OutsourcePerformanceUpdated $event): bool {
            return $event->changes['status']['new'] === 'completed';
        });
    }

    #[Test]
    public function it_dispatches_event_when_outsource_performance_is_deleted(): void
    {
        Event::fake([
            OutsourcePerformanceDeleted::class,
        ]);

        $performance = OutsourcePerformance::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('outsource-performances.destroy', $performance));

        $response->assertRedirect(route('outsource-performances.index'));
        $response->assertSessionHas('success', 'Outsource performance deleted successfully.');

        Event::assertDispatched(OutsourcePerformanceDeleted::class, function (OutsourcePerformanceDeleted $event) use ($performance): bool {
            return $event->performanceId === $performance->id;
        });
    }
}
