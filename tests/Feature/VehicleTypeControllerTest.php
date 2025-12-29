<?php

namespace Tests\Feature;

use App\Events\VehicleTypeCreated;
use App\Events\VehicleTypeDeleted;
use App\Events\VehicleTypeUpdated;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VehicleTypeControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'vehicletypes.view',
            'vehicletypes.store',
            'vehicletypes.update',
            'vehicletypes.destroy',
        ]);
    }

    #[Test]
    public function it_lists_vehicle_types_newest_first(): void
    {
        $olderType = VehicleType::factory()->create(['created_at' => now()->subWeeks(2)]);
        $newerType = VehicleType::factory()->create(['created_at' => now()->subDays(3)]);
        $latestType = VehicleType::factory()->create(['created_at' => now()]);

        $response = $this->actingAs($this->user)
            ->get(route('vehicletypes.index'));

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('VehicleTypes/Index')
                ->has('vehicleTypes.data', 3)
                ->where('vehicleTypes.data.0.id', $latestType->id)
                ->where('vehicleTypes.data.1.id', $newerType->id)
                ->where('vehicleTypes.data.2.id', $olderType->id)
            );
    }

    #[Test]
    public function it_dispatches_event_when_vehicle_type_is_created(): void
    {
        Event::fake([
            VehicleTypeCreated::class,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('vehicletypes.store'), [
                'name' => 'Heavy Duty',
                'description' => 'Supports long-haul operations.',
            ]);

        $response->assertRedirect(route('vehicletypes.index'));
        $response->assertSessionHas('success', 'Vehicle type created successfully.');

        Event::assertDispatched(VehicleTypeCreated::class, function (VehicleTypeCreated $event): bool {
            return $event->vehicleType->name === 'Heavy Duty';
        });
    }

    #[Test]
    public function it_dispatches_event_when_vehicle_type_is_updated(): void
    {
        Event::fake([
            VehicleTypeUpdated::class,
        ]);

        $vehicleType = VehicleType::factory()->create([
            'name' => 'Regional Truck',
            'description' => 'Original description',
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('vehicletypes.update', $vehicleType), [
                'name' => 'Regional Truck',
                'description' => 'Updated description',
            ]);

        $response->assertRedirect(route('vehicletypes.index'));
        $response->assertSessionHas('success', 'Vehicle type updated successfully.');

        Event::assertDispatched(VehicleTypeUpdated::class, function (VehicleTypeUpdated $event): bool {
            return $event->vehicleType->description === 'Updated description'
                && $event->changes['description']['new'] === 'Updated description';
        });
    }

    #[Test]
    public function it_dispatches_event_when_vehicle_type_is_deleted(): void
    {
        Event::fake([
            VehicleTypeDeleted::class,
        ]);

        $vehicleType = VehicleType::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('vehicletypes.destroy', $vehicleType));

        $response->assertRedirect(route('vehicletypes.index'));
        $response->assertSessionHas('success', 'Vehicle type deleted successfully.');

        Event::assertDispatched(VehicleTypeDeleted::class, function (VehicleTypeDeleted $event) use ($vehicleType): bool {
            return $event->vehicleTypeId === $vehicleType->id;
        });
    }
}
