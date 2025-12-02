<?php

namespace Tests\Feature;

use App\Events\FuelRecordCreated;
use App\Events\FuelRecordDeleted;
use App\Events\FuelRecordUpdated;
use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\FuelRecord;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FuelControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'fuel.store',
            'fuel.update',
            'fuel.destroy',
        ]);
    }

    #[Test]
    public function it_dispatches_event_when_fuel_record_is_created(): void
    {
        Event::fake([
            FuelRecordCreated::class,
        ]);

        $driver = Driver::factory()->create(['status' => 'active']);
        $truck = Truck::factory()->create(['status' => 'active']);

        $assignment = DriverTruck::factory()->create([
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
            'status' => 'active',
            'is_attached' => 1,
            'date_detach' => null,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('fuel.store'), [
                'driver_truck_id' => $assignment->id,
                'fuel_date' => now()->toDateString(),
                'fuel_quantity_liters' => 100,
                'fuel_price_per_liter' => 50,
                'fuel_type' => 'diesel',
            ]);

        $response->assertRedirect(route('fuel.index'));
        $response->assertSessionHas('success', 'Fuel record created successfully.');

        Event::assertDispatched(FuelRecordCreated::class, function (FuelRecordCreated $event) use ($truck): bool {
            return $event->fuelRecord->truck_id === $truck->id;
        });
    }

    #[Test]
    public function it_dispatches_event_when_fuel_record_is_updated(): void
    {
        Event::fake([
            FuelRecordUpdated::class,
        ]);

        $driver = Driver::factory()->create(['status' => 'active']);
        $truck = Truck::factory()->create(['status' => 'active']);

        $assignment = DriverTruck::factory()->create([
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
            'status' => 'active',
            'is_attached' => 1,
            'date_detach' => null,
        ]);

        $fuelRecord = FuelRecord::factory()->create([
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
            'driver_truck_id' => $assignment->id,
            'fuel_date' => now()->subDay(),
            'fuel_quantity_liters' => 80,
            'fuel_price_per_liter' => 45,
            'total_cost' => 3_600,
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('fuel.update', $fuelRecord), [
                'driver_truck_id' => $assignment->id,
                'fuel_date' => now()->toDateString(),
                'fuel_quantity_liters' => 90,
                'fuel_price_per_liter' => 50,
                'fuel_type' => 'diesel',
            ]);

        $response->assertRedirect(route('fuel.index'));
        $response->assertSessionHas('success', 'Fuel record updated successfully.');

        Event::assertDispatched(FuelRecordUpdated::class, function (FuelRecordUpdated $event): bool {
            return (float) $event->changes['fuel_quantity_liters']['new'] === 90.0;
        });
    }

    #[Test]
    public function it_dispatches_event_when_fuel_record_is_deleted(): void
    {
        Event::fake([
            FuelRecordDeleted::class,
        ]);

        $fuelRecord = FuelRecord::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('fuel.destroy', $fuelRecord));

        $response->assertRedirect(route('fuel.index'));
        $response->assertSessionHas('success', 'Fuel record deleted successfully.');

        Event::assertDispatched(FuelRecordDeleted::class, function (FuelRecordDeleted $event) use ($fuelRecord): bool {
            return $event->fuelRecordId === $fuelRecord->id;
        });
    }
}
