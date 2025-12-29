<?php

namespace Tests\Feature;

use App\Events\DriverSafetyRecordCreated;
use App\Events\DriverSafetyRecordDeleted;
use App\Events\DriverSafetyRecordUpdated;
use App\Models\Driver;
use App\Models\DriverSafetyRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DriverSafetyControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'driver-safety.view',
            'driver-safety.store',
            'driver-safety.update',
            'driver-safety.destroy',
        ]);
    }

    #[Test]
    public function it_lists_driver_safety_records_newest_first(): void
    {
        $olderRecord = DriverSafetyRecord::factory()->create(['created_at' => now()->subWeeks(2)]);
        $newerRecord = DriverSafetyRecord::factory()->create(['created_at' => now()->subWeek()]);
        $latestRecord = DriverSafetyRecord::factory()->create(['created_at' => now()]);

        $response = $this->actingAs($this->user)
            ->get(route('driver-safety.index'));

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('DriverSafety/Index')
                ->has('safetyRecords.data', 3)
                ->where('safetyRecords.data.0.id', $latestRecord->id)
                ->where('safetyRecords.data.1.id', $newerRecord->id)
                ->where('safetyRecords.data.2.id', $olderRecord->id)
            );
    }

    #[Test]
    public function it_dispatches_event_when_driver_safety_record_is_created(): void
    {
        Event::fake([
            DriverSafetyRecordCreated::class,
        ]);

        $driver = Driver::factory()->create(['status' => 'active']);

        $response = $this->actingAs($this->user)
            ->post(route('driver-safety.store'), [
                'driver_id' => $driver->id,
                'incident_date' => now()->toDateString(),
                'incident_type' => 'accident',
                'description' => 'Minor collision reported.',
                'severity' => 'major',
            ]);

        $response->assertRedirect(route('driver-safety.index'));
        $response->assertSessionHas('success', 'Safety record created successfully.');

        Event::assertDispatched(DriverSafetyRecordCreated::class, function (DriverSafetyRecordCreated $event) use ($driver): bool {
            return $event->safetyRecord->driver_id === $driver->id;
        });
    }

    #[Test]
    public function it_dispatches_event_when_driver_safety_record_is_updated(): void
    {
        Event::fake([
            DriverSafetyRecordUpdated::class,
        ]);

        $driver = Driver::factory()->create(['status' => 'active']);

        $record = DriverSafetyRecord::factory()->create([
            'driver_id' => $driver->id,
            'incident_type' => 'violation',
            'severity' => 'minor',
            'incident_date' => now()->subWeek(),
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('driver-safety.update', $record), [
                'driver_id' => $driver->id,
                'incident_date' => now()->subWeek()->toDateString(),
                'incident_type' => 'violation',
                'description' => 'Updated description',
                'severity' => 'critical',
            ]);

        $response->assertRedirect(route('driver-safety.index'));
        $response->assertSessionHas('success', 'Safety record updated successfully.');

        Event::assertDispatched(DriverSafetyRecordUpdated::class, function (DriverSafetyRecordUpdated $event): bool {
            return $event->changes['severity']['new'] === 'critical';
        });
    }

    #[Test]
    public function it_dispatches_event_when_driver_safety_record_is_deleted(): void
    {
        Event::fake([
            DriverSafetyRecordDeleted::class,
        ]);

        $record = DriverSafetyRecord::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('driver-safety.destroy', $record));

        $response->assertRedirect(route('driver-safety.index'));
        $response->assertSessionHas('success', 'Safety record deleted successfully.');

        Event::assertDispatched(DriverSafetyRecordDeleted::class, function (DriverSafetyRecordDeleted $event) use ($record): bool {
            return $event->safetyRecordId === $record->id;
        });
    }
}
