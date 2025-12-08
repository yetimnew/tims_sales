<?php

namespace Tests\Feature;

use App\Events\PlaceCreated;
use App\Events\PlaceDeleted;
use App\Events\PlaceUpdated;
use App\Models\Place;
use App\Models\User;
use App\Models\Woreda;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Testing\Fluent\AssertableJson;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PlaceControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'places.store',
            'places.update',
            'places.destroy',
            'places.view',
        ]);
    }

    #[Test]
    public function it_dispatches_event_when_place_is_created(): void
    {
        Event::fake([
            PlaceCreated::class,
        ]);

        $woreda = Woreda::factory()->create();

        $response = $this->actingAs($this->user)
            ->post(route('places.store'), [
                'name' => 'Summit Logistics Hub',
                'code' => 'SLH',
                'woreda_id' => $woreda->id,
                'status' => 'active',
                'is_logistics_hub' => true,
            ]);

        $response->assertRedirect(route('places.index'));
        $response->assertSessionHas('success', 'Place created successfully.');

        Event::assertDispatched(PlaceCreated::class, function (PlaceCreated $event) use ($woreda): bool {
            return $event->place->woreda_id === $woreda->id;
        });
    }

    #[Test]
    public function it_dispatches_event_when_place_is_updated(): void
    {
        Event::fake([
            PlaceUpdated::class,
        ]);

        $place = Place::factory()->create([
            'status' => 'active',
            'is_logistics_hub' => false,
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('places.update', $place), [
                'name' => $place->name,
                'code' => $place->code,
                'woreda_id' => $place->woreda_id,
                'status' => 'active',
                'is_logistics_hub' => true,
            ]);

        $response->assertRedirect(route('places.index'));
        $response->assertSessionHas('success', 'Place updated successfully.');

        Event::assertDispatched(PlaceUpdated::class, function (PlaceUpdated $event): bool {
            return $event->changes['is_logistics_hub']['new'] === true;
        });
    }

    #[Test]
    public function it_dispatches_event_when_place_is_deleted(): void
    {
        Event::fake([
            PlaceDeleted::class,
        ]);

        $place = Place::factory()->create([
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->delete(route('places.destroy', $place));

        $response->assertRedirect(route('places.index'));
        $response->assertSessionHas('success', 'Place deleted successfully.');

        Event::assertDispatched(PlaceDeleted::class, function (PlaceDeleted $event) use ($place): bool {
            return $event->placeId === $place->id;
        });
    }

    #[Test]
    public function it_returns_places_for_remote_search(): void
    {
        $matchingPrimary = Place::factory()->create([
            'name' => 'Alpha Logistics Hub',
            'code' => 'ALH',
            'status' => 'active',
        ]);

        $matchingSecondary = Place::factory()->create([
            'name' => 'Zulu Logistics Hub',
            'code' => 'ZLH',
            'status' => 'active',
        ]);

        $inactive = Place::factory()->create([
            'name' => 'Logistics Inactive Site',
            'code' => 'LIS',
            'status' => 'inactive',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson(route('places.search', [
                'search' => 'Logistics',
                'limit' => 1,
                'selected' => [$matchingSecondary->id],
            ]));

        $response->assertOk();

        $response->assertJson(fn (AssertableJson $json) => $json
            ->where('has_more', true)
            ->has('data', 2)
            ->has('data.0', fn (AssertableJson $item) => $item
                ->where('id', $matchingPrimary->id)
                ->where('name', $matchingPrimary->name)
                ->where('code', $matchingPrimary->code)
                ->has('woreda', fn (AssertableJson $woreda) => $woreda
                    ->where('id', $matchingPrimary->woreda->id)
                    ->where('name', $matchingPrimary->woreda->name)
                    ->has('zone', fn (AssertableJson $zone) => $zone
                        ->where('id', $matchingPrimary->woreda->zone->id)
                        ->where('name', $matchingPrimary->woreda->zone->name)
                        ->has('region', fn (AssertableJson $region) => $region
                            ->where('id', $matchingPrimary->woreda->zone->region->id)
                            ->where('name', $matchingPrimary->woreda->zone->region->name)
                        )
                    )
                )
            )
            ->has('data.1', fn (AssertableJson $item) => $item
                ->where('id', $matchingSecondary->id)
                ->where('name', $matchingSecondary->name)
                ->where('code', $matchingSecondary->code)
                ->has('woreda')
            )
        );

        $placeIds = collect($response->json('data'))->pluck('id');
        $this->assertFalse($placeIds->contains($inactive->id));
    }
}
