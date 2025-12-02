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
}
