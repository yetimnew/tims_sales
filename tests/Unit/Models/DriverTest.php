<?php

namespace Tests\Unit\Models;

use App\Models\Driver;
use App\Models\DriverPerformanceRecord;
use App\Models\DriverSafetyRecord;
use App\Models\DriverTruck;
use App\Models\Performance;
use App\Models\Truck;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DriverTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_can_create_a_driver()
    {
        $driver = Driver::factory()->create([
            'name' => 'John Doe',
            'status' => 'active',
        ]);

        $this->assertInstanceOf(Driver::class, $driver);
        $this->assertEquals('John Doe', $driver->name);
        $this->assertEquals('active', $driver->status);
    }

    #[Test]
    public function it_can_soft_delete_a_driver()
    {
        $driver = Driver::factory()->create();
        $driverId = $driver->id;

        $driver->delete();

        $this->assertSoftDeleted('drivers', ['id' => $driverId]);
        $this->assertDatabaseHas('drivers', ['id' => $driverId]);
    }

    #[Test]
    public function it_can_have_many_trucks()
    {
        $driver = Driver::factory()->create();
        $truck1 = Truck::factory()->create();
        $truck2 = Truck::factory()->create();

        $driver->trucks()->attach($truck1->id, [
            'assigned_date' => now(),
            'status' => 'active',
        ]);
        $driver->trucks()->attach($truck2->id, [
            'assigned_date' => now(),
            'status' => 'active',
        ]);

        $this->assertCount(2, $driver->trucks);
        $this->assertTrue($driver->trucks->contains($truck1));
        $this->assertTrue($driver->trucks->contains($truck2));
    }

    #[Test]
    public function it_has_many_performances()
    {
        $driver = Driver::factory()->create();
        $truck = Truck::factory()->create();

        $driverTruck = DriverTruck::factory()
            ->for($driver, 'driver')
            ->for($truck, 'truck')
            ->create();

        Performance::factory()->count(3)->create(['driver_truck_id' => $driverTruck->id]);

        $this->assertCount(3, $driver->performances);
        $this->assertInstanceOf(Performance::class, $driver->performances->first());
    }

    #[Test]
    public function it_has_many_performance_records()
    {
        $driver = Driver::factory()->create();
        $truck = Truck::factory()->create();

        DriverPerformanceRecord::factory()->count(2)->create([
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
        ]);

        $this->assertCount(2, $driver->performanceRecords);
        $this->assertInstanceOf(DriverPerformanceRecord::class, $driver->performanceRecords->first());
    }

    #[Test]
    public function it_has_many_safety_records()
    {
        $driver = Driver::factory()->create();

        DriverSafetyRecord::factory()->count(2)->create(['driver_id' => $driver->id]);

        $this->assertCount(2, $driver->safetyRecords);
        $this->assertInstanceOf(DriverSafetyRecord::class, $driver->safetyRecords->first());
    }

    #[Test]
    public function it_casts_dates_correctly()
    {
        $driver = Driver::factory()->create([
            'birthdate' => '1990-05-15',
            'hireddate' => '2020-01-01',
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $driver->birthdate);
        $this->assertInstanceOf(\Carbon\Carbon::class, $driver->hireddate);
    }

    #[Test]
    public function it_has_fillable_attributes()
    {
        $fillable = [
            'driverid',
            'name',
            'sex',
            'birthdate',
            'zone',
            'woreda',
            'kebele',
            'housenumber',
            'mobile',
            'hireddate',
            'status',
        ];

        $driver = new Driver;
        $this->assertEquals($fillable, $driver->getFillable());
    }

    #[Test]
    public function it_can_scope_active_drivers()
    {
        Driver::factory()->create(['status' => 'active']);
        Driver::factory()->create(['status' => 'inactive']);
        Driver::factory()->create(['status' => 'suspended']);

        $activeDrivers = Driver::where('status', 'active')->get();

        $this->assertCount(1, $activeDrivers);
        $this->assertEquals('active', $activeDrivers->first()->status);
    }

    #[Test]
    public function it_can_calculate_total_performance_tonnage()
    {
        $driver = Driver::factory()->create();
        $truck = Truck::factory()->create();

        $driverTruck = DriverTruck::factory()
            ->for($driver, 'driver')
            ->for($truck, 'truck')
            ->create();

        Performance::factory()->create([
            'driver_truck_id' => $driverTruck->id,
            'CargoVolumMT' => 10.5,
        ]);
        Performance::factory()->create([
            'driver_truck_id' => $driverTruck->id,
            'CargoVolumMT' => 15.0,
        ]);

        $totalTonnage = $driver->performances->sum('CargoVolumMT');

        $this->assertEquals(25.5, $totalTonnage);
    }

    #[Test]
    public function it_can_get_current_assigned_truck()
    {
        $driver = Driver::factory()->create();
        $truck = Truck::factory()->create();

        $driver->trucks()->attach($truck->id, [
            'assigned_date' => now(),
            'status' => 'active',
        ]);

        $currentTruck = $driver->trucks()->wherePivot('status', 'active')->first();

        $this->assertInstanceOf(Truck::class, $currentTruck);
        $this->assertEquals($truck->id, $currentTruck->id);
    }

    #[Test]
    public function it_can_get_performance_average_rating()
    {
        $driver = Driver::factory()->create();
        DriverPerformanceRecord::factory()->create([
            'driver_id' => $driver->id,
            'customer_rating' => 4.5,
        ]);
        DriverPerformanceRecord::factory()->create([
            'driver_id' => $driver->id,
            'customer_rating' => 3.5,
        ]);

        $averageRating = $driver->performanceRecords->avg('customer_rating');

        $this->assertEquals(4.0, $averageRating);
    }
}
