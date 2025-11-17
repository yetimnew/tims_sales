<?php

namespace Tests\Feature\OutsourcePerformance;

use App\Models\Operation;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShowOutsourcePerformanceTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_renders_the_outsource_performance_detail_with_vendor_metrics(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        /** @var Outsource $outsource */
        $outsource = Outsource::factory()->create([
            'name' => 'Atlas Logistics',
        ]);

        /** @var Operation $operation */
        $operation = Operation::factory()->create([
            'operationid' => 'OP-1001',
        ]);

        /** @var Place $origin */
        $origin = Place::factory()->create([
            'name' => 'Addis Ababa',
        ]);

        /** @var Place $destination */
        $destination = Place::factory()->create([
            'name' => 'Dire Dawa',
        ]);

        $latestDispatch = now()->startOfDay();

        $performance = OutsourcePerformance::factory()
            ->for($outsource)
            ->for($operation)
            ->for($origin, 'fromPlace')
            ->for($destination, 'toPlace')
            ->for($user)
            ->create([
                'trip_number' => 'OUT-0001',
                'dispatch_date' => $latestDispatch,
                'distance_km' => 450.00,
                'cargo_volume_mt' => 30.00,
                'tonkm' => 13500.00,
                'cost' => 25000.00,
                'status' => 'completed',
            ]);

        OutsourcePerformance::factory()
            ->for($outsource)
            ->for($operation)
            ->for(Place::factory(['name' => 'Adama']), 'fromPlace')
            ->for(Place::factory(['name' => 'Awash']), 'toPlace')
            ->for($user)
            ->create([
                'dispatch_date' => $latestDispatch->copy()->subDays(2),
                'distance_km' => 100.00,
                'cargo_volume_mt' => 10.00,
                'tonkm' => 1000.00,
                'cost' => 5000.00,
                'status' => 'completed',
            ]);

        OutsourcePerformance::factory()
            ->for($outsource)
            ->for($operation)
            ->for(Place::factory(['name' => 'Mekelle']), 'fromPlace')
            ->for(Place::factory(['name' => 'Bahir Dar']), 'toPlace')
            ->for($user)
            ->create([
                'dispatch_date' => $latestDispatch->copy()->subDays(5),
                'distance_km' => 200.00,
                'cargo_volume_mt' => 20.00,
                'tonkm' => 4000.00,
                'cost' => 10000.00,
                'status' => 'active',
            ]);

        $response = $this->actingAs($user)
            ->get(route('outsource-performances.show', $performance));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('OutsourcePerformances/Show')
                ->where('performance.trip_number', 'OUT-0001')
                ->where('performance.outsource.name', 'Atlas Logistics')
                ->where('performance.operation.label', 'OP-1001')
                ->where('performance.from_place.name', 'Addis Ababa')
                ->where('performance.to_place.name', 'Dire Dawa')
                ->where('metrics.vendorTripCount', 3)
                ->where('metrics.vendorTotalDistance', 750)
                ->where('metrics.vendorTotalCargo', 60)
                ->where('metrics.vendorTotalCost', 40000)
                ->where('recentTrips.0.id', $performance->id)
                ->where('recentTrips.0.highlight', true)
            );
    }
}
