<?php

namespace Tests\Feature;

use App\Events\ZoneCreated;
use App\Events\ZoneDeleted;
use App\Events\ZoneUpdated;
use App\Models\Region;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ZoneControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'zones.store',
            'zones.update',
            'zones.destroy',
        ]);
    }

    #[Test]
    public function it_dispatches_event_when_zone_is_created(): void
    {
        Event::fake([
            ZoneCreated::class,
        ]);

        $region = Region::factory()->create();

        $response = $this->actingAs($this->user)
            ->post(route('zones.store'), [
                'name' => 'Logistics Zone',
                'code' => 'LZ1',
                'region_id' => $region->id,
                'status' => 'active',
            ]);

        $response->assertRedirect(route('zones.index'));
        $response->assertSessionHas('success', 'Zone created successfully.');

        Event::assertDispatched(ZoneCreated::class, function (ZoneCreated $event) use ($region): bool {
            return $event->zone->region_id === $region->id;
        });
    }

    #[Test]
    public function it_dispatches_event_when_zone_is_updated(): void
    {
        Event::fake([
            ZoneUpdated::class,
        ]);

        $zone = Zone::factory()->create([
            'name' => 'Distribution Zone',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('zones.update', $zone), [
                'name' => 'Distribution Zone',
                'code' => $zone->code,
                'region_id' => $zone->region_id,
                'status' => 'inactive',
            ]);

        $response->assertRedirect(route('zones.index'));
        $response->assertSessionHas('success', 'Zone updated successfully.');

        Event::assertDispatched(ZoneUpdated::class, function (ZoneUpdated $event): bool {
            return $event->changes['status']['new'] === 'inactive';
        });
    }

    #[Test]
    public function it_dispatches_event_when_zone_is_deleted(): void
    {
        Event::fake([
            ZoneDeleted::class,
        ]);

        $zone = Zone::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('zones.destroy', $zone));

        $response->assertRedirect(route('zones.index'));
        $response->assertSessionHas('success', 'Zone deleted successfully.');

        Event::assertDispatched(ZoneDeleted::class, function (ZoneDeleted $event) use ($zone): bool {
            return $event->zoneId === $zone->id;
        });
    }
}
