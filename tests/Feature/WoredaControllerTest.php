<?php

namespace Tests\Feature;

use App\Events\WoredaCreated;
use App\Events\WoredaDeleted;
use App\Events\WoredaUpdated;
use App\Models\User;
use App\Models\Woreda;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WoredaControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'woredas.store',
            'woredas.update',
            'woredas.destroy',
        ]);
    }

    #[Test]
    public function it_dispatches_event_when_woreda_is_created(): void
    {
        Event::fake([
            WoredaCreated::class,
        ]);

        $zone = Zone::factory()->create();

        $response = $this->actingAs($this->user)
            ->post(route('woredas.store'), [
                'name' => 'Transit Woreda',
                'code' => 'TW01',
                'zone_id' => $zone->id,
                'status' => 'active',
            ]);

        $response->assertRedirect(route('woredas.index'));
        $response->assertSessionHas('success', 'Woreda created successfully.');

        Event::assertDispatched(WoredaCreated::class, function (WoredaCreated $event) use ($zone): bool {
            return $event->woreda->zone_id === $zone->id;
        });
    }

    #[Test]
    public function it_dispatches_event_when_woreda_is_updated(): void
    {
        Event::fake([
            WoredaUpdated::class,
        ]);

        $woreda = Woreda::factory()->create([
            'administrative_center' => 'Old Center',
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('woredas.update', $woreda), [
                'name' => $woreda->name,
                'code' => $woreda->code,
                'zone_id' => $woreda->zone_id,
                'status' => 'active',
                'administrative_center' => 'New Center',
            ]);

        $response->assertRedirect(route('woredas.index'));
        $response->assertSessionHas('success', 'Woreda updated successfully.');

        Event::assertDispatched(WoredaUpdated::class, function (WoredaUpdated $event): bool {
            return $event->changes['administrative_center']['new'] === 'New Center';
        });
    }

    #[Test]
    public function it_dispatches_event_when_woreda_is_deleted(): void
    {
        Event::fake([
            WoredaDeleted::class,
        ]);

        $woreda = Woreda::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('woredas.destroy', $woreda));

        $response->assertRedirect(route('woredas.index'));
        $response->assertSessionHas('success', 'Woreda deleted successfully.');

        Event::assertDispatched(WoredaDeleted::class, function (WoredaDeleted $event) use ($woreda): bool {
            return $event->woredaId === $woreda->id;
        });
    }
}
