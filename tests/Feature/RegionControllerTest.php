<?php

namespace Tests\Feature;

use App\Events\RegionCreated;
use App\Events\RegionDeleted;
use App\Events\RegionUpdated;
use App\Models\Region;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RegionControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'regions.store',
            'regions.update',
            'regions.destroy',
        ]);
    }

    #[Test]
    public function it_dispatches_event_when_region_is_created(): void
    {
        Event::fake([
            RegionCreated::class,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('regions.store'), [
                'name' => 'Central Region',
                'code' => 'CR',
                'status' => 'active',
                'description' => 'Central territory operations hub.',
            ]);

        $response->assertRedirect(route('regions.index'));
        $response->assertSessionHas('success', 'Region created successfully.');

        Event::assertDispatched(RegionCreated::class, function (RegionCreated $event): bool {
            return $event->region->name === 'Central Region';
        });
    }

    #[Test]
    public function it_dispatches_event_when_region_is_updated(): void
    {
        Event::fake([
            RegionUpdated::class,
        ]);

        $region = Region::factory()->create([
            'name' => 'North Region',
            'code' => 'NR',
            'population' => 1500000,
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('regions.update', $region), [
                'name' => 'North Region',
                'code' => 'NR',
                'status' => 'active',
                'population' => 1750000,
            ]);

        $response->assertRedirect(route('regions.index'));
        $response->assertSessionHas('success', 'Region updated successfully.');

        Event::assertDispatched(RegionUpdated::class, function (RegionUpdated $event): bool {
            return $event->changes['population']['new'] === 1750000;
        });
    }

    #[Test]
    public function it_dispatches_event_when_region_is_deleted(): void
    {
        Event::fake([
            RegionDeleted::class,
        ]);

        $region = Region::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('regions.destroy', $region));

        $response->assertRedirect(route('regions.index'));
        $response->assertSessionHas('success', 'Region deleted successfully.');

        Event::assertDispatched(RegionDeleted::class, function (RegionDeleted $event) use ($region): bool {
            return $event->regionId === $region->id;
        });
    }
}
