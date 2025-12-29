<?php

namespace Tests\Feature;

use App\Events\DriverTruckCreated;
use App\Events\DriverTruckDeleted;
use App\Events\DriverTruckUpdated;
use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\FuelRecord;
use App\Models\Performance;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DriverTruckControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, ['driver-trucks.view', 'driver-trucks.destroy']);
    }

    #[Test]
    public function it_lists_driver_truck_assignments_newest_first(): void
    {
        $olderAssignment = DriverTruck::factory()->create(['created_at' => now()->subDays(5)]);
        $newerAssignment = DriverTruck::factory()->create(['created_at' => now()->subDays(2)]);
        $latestAssignment = DriverTruck::factory()->create(['created_at' => now()]);

        $response = $this->actingAs($this->user)
            ->get(route('driver-trucks.index'));

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('DriverTrucks/Index')
                ->has('driverTrucks.data', 3)
                ->where('driverTrucks.data.0.id', $latestAssignment->id)
                ->where('driverTrucks.data.1.id', $newerAssignment->id)
                ->where('driverTrucks.data.2.id', $olderAssignment->id)
            );
    }

    #[Test]
    public function it_prevents_deleting_assignments_with_performance_records(): void
    {
        $assignment = DriverTruck::factory()->create();
        Performance::factory()->create([
            'driver_truck_id' => $assignment->id,
        ]);

        $response = $this->actingAs($this->user)
            ->from(route('driver-trucks.index'))
            ->delete(route('driver-trucks.destroy', $assignment));

        $response->assertRedirect();
        $response->assertSessionHasErrors('error');

        /** @var \Illuminate\Support\ViewErrorBag|null $errors */
        $errors = session('errors');
        $this->assertNotNull($errors);
        $errorMessages = $errors->getBag('default')->get('error');
        $this->assertNotEmpty($errorMessages);
        $this->assertStringContainsString(
            'performance record',
            implode(' ', $errorMessages)
        );

        $this->assertDatabaseHas('driver_truck', [
            'id' => $assignment->id,
            'deleted_at' => null,
        ]);
    }

    #[Test]
    public function it_prevents_deleting_assignments_with_fuel_records(): void
    {
        $assignment = DriverTruck::factory()->create();

        FuelRecord::factory()->create([
            'driver_truck_id' => $assignment->id,
            'truck_id' => $assignment->truck_id,
            'driver_id' => $assignment->driver_id,
        ]);

        $response = $this->actingAs($this->user)
            ->from(route('driver-trucks.index'))
            ->delete(route('driver-trucks.destroy', $assignment));

        $response->assertRedirect();
        $response->assertSessionHasErrors('error');

        /** @var \Illuminate\Support\ViewErrorBag|null $errors */
        $errors = session('errors');
        $this->assertNotNull($errors);
        $errorMessages = $errors->getBag('default')->get('error');
        $this->assertNotEmpty($errorMessages);
        $this->assertStringContainsString(
            'fuel record',
            implode(' ', $errorMessages)
        );

        $this->assertDatabaseHas('driver_truck', [
            'id' => $assignment->id,
            'deleted_at' => null,
        ]);
    }

    #[Test]
    public function it_deletes_assignments_without_blocking_relationships(): void
    {
        $assignment = DriverTruck::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('driver-trucks.destroy', $assignment));

        $response->assertRedirect(route('driver-trucks.index'));
        $response->assertSessionHas('success', 'Driver-truck assignment deleted successfully.');

        $this->assertSoftDeleted('driver_truck', [
            'id' => $assignment->id,
        ]);
    }

    #[Test]
    public function it_dispatches_event_when_assignment_is_created(): void
    {
        Event::fake([
            DriverTruckCreated::class,
        ]);

        $this->givePermissions($this->user, ['driver-trucks.create']);

        $driver = Driver::factory()->create(['status' => 'active']);
        $truck = Truck::factory()->create(['status' => 'active']);

        $response = $this->actingAs($this->user)
            ->post(route('driver-trucks.store'), [
                'truck_id' => $truck->id,
                'driver_id' => $driver->id,
                'date_recived' => now()->toDateString(),
            ]);

        $response->assertRedirect(route('driver-trucks.index'));
        $response->assertSessionHas('success', 'Driver and truck assigned successfully.');

        Event::assertDispatched(DriverTruckCreated::class, function (DriverTruckCreated $event) use ($driver, $truck): bool {
            return $event->assignment->driver_id === $driver->id
                && $event->assignment->truck_id === $truck->id;
        });
    }

    #[Test]
    public function it_dispatches_event_when_assignment_is_updated(): void
    {
        Event::fake([
            DriverTruckUpdated::class,
        ]);

        $this->givePermissions($this->user, ['driver-trucks.edit']);

        $assignment = DriverTruck::factory()->create([
            'status' => 'active',
            'is_attached' => 1,
            'date_detach' => null,
            'reason' => null,
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('driver-trucks.update', $assignment), [
                'truck_id' => $assignment->truck_id,
                'driver_id' => $assignment->driver_id,
                'date_recived' => $assignment->date_recived?->toDateString() ?? now()->subDay()->toDateString(),
                'date_detach' => now()->toDateString(),
                'reason' => 'Routine rotation',
            ]);

        $response->assertRedirect(route('driver-trucks.index'));
        $response->assertSessionHas('success', 'Driver-truck assignment updated successfully.');

        Event::assertDispatched(DriverTruckUpdated::class, function (DriverTruckUpdated $event): bool {
            return array_key_exists('date_detach', $event->changes)
                && $event->changes['reason']['new'] === 'Routine rotation';
        });
    }

    #[Test]
    public function it_dispatches_event_when_assignment_is_deleted(): void
    {
        Event::fake([
            DriverTruckDeleted::class,
        ]);

        $assignment = DriverTruck::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('driver-trucks.destroy', $assignment));

        $response->assertRedirect(route('driver-trucks.index'));

        Event::assertDispatched(DriverTruckDeleted::class, function (DriverTruckDeleted $event) use ($assignment): bool {
            return $event->assignmentId === $assignment->id;
        });
    }
}
