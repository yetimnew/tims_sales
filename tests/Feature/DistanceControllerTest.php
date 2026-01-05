<?php

namespace Tests\Feature;

use App\Events\DistanceCreated;
use App\Events\DistanceDeleted;
use App\Events\DistanceUpdated;
use App\Models\Distance;
use App\Models\Place;
use App\Models\User;
use App\Models\Woreda;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DistanceControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $this->givePermissions($this->user, [
            'distances.store',
            'distances.update',
            'distances.destroy',
            'distances.view',
        ]);
    }

    #[Test]
    public function it_filters_distances_by_zone_and_woreda(): void
    {
        $matchingZone = Zone::factory()->create(['name' => 'Lasta Corridor']);
        $otherZone = Zone::factory()->create(['name' => 'Shewa Highlands']);

        $matchingWoreda = Woreda::factory()->create([
            'zone_id' => $matchingZone->id,
            'name' => 'Gashena',
        ]);
        $otherWoreda = Woreda::factory()->create([
            'zone_id' => $otherZone->id,
            'name' => 'Debre Markos',
        ]);

        $matchingOrigin = Place::factory()->create(['woreda_id' => $matchingWoreda->id]);
        $matchingDestination = Place::factory()->create(['woreda_id' => $matchingWoreda->id]);
        $otherOrigin = Place::factory()->create(['woreda_id' => $otherWoreda->id]);
        $otherDestination = Place::factory()->create(['woreda_id' => $otherWoreda->id]);

        $matchingDistance = Distance::query()->create([
            'from_place_id' => $matchingOrigin->id,
            'to_place_id' => $matchingDestination->id,
            'distance_km' => 150,
            'estimated_time_hours' => 3.5,
            'route_type' => 'primary',
            'status' => 'active',
        ]);

        Distance::query()->create([
            'from_place_id' => $otherOrigin->id,
            'to_place_id' => $otherDestination->id,
            'distance_km' => 220,
            'estimated_time_hours' => 4.8,
            'route_type' => 'secondary',
            'status' => 'active',
        ]);

        $zoneResponse = $this->actingAs($this->user)
            ->get(route('distances.index', ['zone' => 'Lasta Corridor']));

        $zoneResponse->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Distances/Index')
                ->where('filters.zone', 'Lasta Corridor')
                ->has('distances.data', 1)
                ->where('distances.data.0.id', $matchingDistance->id)
            );

        $woredaResponse = $this->actingAs($this->user)
            ->get(route('distances.index', ['woreda' => 'Gashena']));

        $woredaResponse->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Distances/Index')
                ->where('filters.woreda', 'Gashena')
                ->has('distances.data', 1)
                ->where('distances.data.0.id', $matchingDistance->id)
            );
    }

    #[Test]
    public function it_dispatches_event_when_distance_is_created(): void
    {
        Event::fake([
            DistanceCreated::class,
        ]);

        $fromPlace = Place::factory()->create();
        $toPlace = Place::factory()->create();

        $response = $this->actingAs($this->user)
            ->post(route('distances.store'), [
                'from_place_id' => $fromPlace->id,
                'to_place_id' => $toPlace->id,
                'distance_km' => 125.5,
                'status' => 'active',
                'estimated_time_hours' => 2.5,
                'route_description' => 'Primary logistics corridor',
                'route_type' => 'primary',
                'estimated_travel_time_minutes' => 150,
                'road_condition_factor' => 1.1,
                'toll_road' => true,
                'toll_cost' => 25,
                'restricted_for_heavy_vehicles' => false,
                'route_notes' => 'Well maintained',
                'average_speed_kmph' => 80,
                'typical_delay_minutes' => 5,
                'road_quality_index' => 8.5,
                'seasonality_notes' => 'Occasional rainy season flooding',
                'safety_notes' => 'Standard precautions',
            ]);

        $response->assertRedirect(route('distances.index'));
        $response->assertSessionHas('success', 'Distance created successfully.');

        Event::assertDispatched(DistanceCreated::class, function (DistanceCreated $event) use ($fromPlace, $toPlace): bool {
            return $event->distance->from_place_id === $fromPlace->id
                && $event->distance->to_place_id === $toPlace->id;
        });
    }

    #[Test]
    public function it_dispatches_event_when_distance_is_updated(): void
    {
        Event::fake([
            DistanceUpdated::class,
        ]);

        $fromPlace = Place::factory()->create();
        $toPlace = Place::factory()->create();

        $distance = Distance::query()->create([
            'from_place_id' => $fromPlace->id,
            'to_place_id' => $toPlace->id,
            'distance_km' => 90.5,
            'status' => 'active',
            'estimated_time_hours' => 1.8,
            'route_description' => 'Existing route',
            'route_type' => 'primary',
            'estimated_travel_time_minutes' => 108,
            'road_condition_factor' => 1.0,
            'toll_road' => false,
            'toll_cost' => 0,
            'restricted_for_heavy_vehicles' => false,
            'route_notes' => 'All-weather surface',
            'average_speed_kmph' => 70,
            'typical_delay_minutes' => 10,
            'road_quality_index' => 7.5,
            'seasonality_notes' => null,
            'safety_notes' => null,
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('distances.update', $distance), [
                'from_place_id' => $distance->from_place_id,
                'to_place_id' => $distance->to_place_id,
                'distance_km' => $distance->distance_km,
                'status' => 'inactive',
                'estimated_time_hours' => $distance->estimated_time_hours,
                'route_description' => $distance->route_description,
                'route_type' => $distance->route_type,
                'estimated_travel_time_minutes' => $distance->estimated_travel_time_minutes,
                'road_condition_factor' => $distance->road_condition_factor,
                'toll_road' => $distance->toll_road,
                'toll_cost' => $distance->toll_cost,
                'restricted_for_heavy_vehicles' => true,
                'route_notes' => $distance->route_notes,
                'average_speed_kmph' => $distance->average_speed_kmph,
                'typical_delay_minutes' => $distance->typical_delay_minutes,
                'road_quality_index' => $distance->road_quality_index,
                'seasonality_notes' => $distance->seasonality_notes,
                'safety_notes' => $distance->safety_notes,
            ]);

        $response->assertRedirect(route('distances.index'));
        $response->assertSessionHas('success', 'Distance updated successfully.');

        Event::assertDispatched(DistanceUpdated::class, function (DistanceUpdated $event): bool {
            return $event->changes['status']['new'] === 'inactive'
                && $event->changes['restricted_for_heavy_vehicles']['new'] === true;
        });
    }

    #[Test]
    public function it_dispatches_event_when_distance_is_deleted(): void
    {
        Event::fake([
            DistanceDeleted::class,
        ]);

        $fromPlace = Place::factory()->create();
        $toPlace = Place::factory()->create();

        $distance = Distance::query()->create([
            'from_place_id' => $fromPlace->id,
            'to_place_id' => $toPlace->id,
            'distance_km' => 140,
            'status' => 'active',
            'estimated_time_hours' => 3.0,
            'route_description' => 'Baseline corridor',
            'route_type' => 'primary',
            'estimated_travel_time_minutes' => 180,
            'road_condition_factor' => 1.0,
            'toll_road' => false,
            'toll_cost' => 0,
            'restricted_for_heavy_vehicles' => false,
            'route_notes' => null,
            'average_speed_kmph' => 70,
            'typical_delay_minutes' => 5,
            'road_quality_index' => 6.5,
            'seasonality_notes' => null,
            'safety_notes' => null,
        ]);

        $response = $this->actingAs($this->user)
            ->delete(route('distances.destroy', $distance));

        $response->assertRedirect(route('distances.index'));
        $response->assertSessionHas('success', 'Distance deleted successfully.');

        Event::assertDispatched(DistanceDeleted::class, function (DistanceDeleted $event) use ($distance): bool {
            return $event->distanceId === $distance->id
                && $event->fromPlaceId === $distance->from_place_id
                && $event->toPlaceId === $distance->to_place_id;
        });
    }
}
