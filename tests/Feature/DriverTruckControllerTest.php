<?php

namespace Tests\Feature;

use App\Models\DriverTruck;
use App\Models\FuelRecord;
use App\Models\Performance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        $this->givePermissions($this->user, ['driver-trucks.destroy']);
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
}
