<?php

namespace Tests\Unit\Models;

use App\Models\Driver;
use App\Models\FuelRecord;
use App\Models\Operation;
use App\Models\RoutePlan;
use App\Models\Truck;
use App\Models\TruckFinancialRecord;
use App\Models\User;
use App\Models\VehicleMaintenanceRecord;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TruckTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_can_create_a_truck()
    {
        $truck = Truck::factory()->create([
            'plate' => 'ABC-123',
            'status' => 'active',
        ]);

        $this->assertInstanceOf(Truck::class, $truck);
        $this->assertEquals('ABC-123', $truck->plate);
        $this->assertEquals('active', $truck->status);
    }

    #[Test]
    public function it_can_soft_delete_a_truck()
    {
        $truck = Truck::factory()->create();
        $truckId = $truck->id;

        $truck->delete();

        $this->assertSoftDeleted('trucks', ['id' => $truckId]);
        $this->assertDatabaseHas('trucks', ['id' => $truckId]);
    }

    #[Test]
    public function it_belongs_to_a_vehicle_type()
    {
        $vehicleType = VehicleType::factory()->create();
        $truck = Truck::factory()->create(['vehicletype_id' => $vehicleType->id]);

        $this->assertInstanceOf(VehicleType::class, $truck->vehicleType);
        $this->assertEquals($vehicleType->id, $truck->vehicleType->id);
    }

    #[Test]
    public function it_can_have_many_drivers()
    {
        $truck = Truck::factory()->create();
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();

        $truck->drivers()->attach($driver1->id, [
            'assigned_date' => now(),
            'status' => 'active',
        ]);
        $truck->drivers()->attach($driver2->id, [
            'assigned_date' => now(),
            'status' => 'active',
        ]);

        $this->assertCount(2, $truck->drivers);
        $this->assertTrue($truck->drivers->contains($driver1));
        $this->assertTrue($truck->drivers->contains($driver2));
    }

    #[Test]
    public function it_has_many_maintenance_records()
    {
        $truck = Truck::factory()->create();
        VehicleMaintenanceRecord::factory()->count(3)->create(['truck_id' => $truck->id]);

        $this->assertCount(3, $truck->maintenanceRecords);
        $this->assertInstanceOf(VehicleMaintenanceRecord::class, $truck->maintenanceRecords->first());
    }

    #[Test]
    public function it_has_many_fuel_records()
    {
        $truck = Truck::factory()->create();
        FuelRecord::factory()->count(5)->create(['truck_id' => $truck->id]);

        $this->assertCount(5, $truck->fuelRecords);
        $this->assertInstanceOf(FuelRecord::class, $truck->fuelRecords->first());
    }

    #[Test]
    public function it_has_many_financial_records()
    {
        $truck = Truck::factory()->create();
        TruckFinancialRecord::factory()->count(2)->create(['truck_id' => $truck->id]);

        $truck->refresh();

        $this->assertCount(2, $truck->financialRecords);
        $this->assertInstanceOf(TruckFinancialRecord::class, $truck->financialRecords->first());
    }

    #[Test]
    public function it_has_many_route_plans()
    {
        $truck = Truck::factory()->create();
        $operation = Operation::factory()->create();
        $driver = Driver::factory()->create();
        $user = User::factory()->create();

        $routePlanData = [
            'operation_id' => $operation->id,
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'planned_date' => now()->toDateString(),
            'planned_departure_time' => now()->setTime(8, 0),
            'planned_arrival_time' => now()->setTime(16, 0),
            'route_waypoints' => [],
            'total_distance_km' => 100.50,
            'total_travel_time_minutes' => 480,
            'estimated_fuel_cost' => 750.00,
            'status' => 'planned',
            'notes' => null,
            'user_id' => $user->id,
        ];

        RoutePlan::create($routePlanData);
        RoutePlan::create(array_merge($routePlanData, [
            'planned_date' => now()->addDay()->toDateString(),
        ]));

        $truck->load('routePlans');

        $this->assertCount(2, $truck->routePlans);
        $this->assertInstanceOf(RoutePlan::class, $truck->routePlans->first());
    }

    #[Test]
    public function it_casts_dates_correctly()
    {
        $truck = Truck::factory()->create([
            'productionDate' => '2023-01-15',
            'serviceStartDate' => '2023-02-01',
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $truck->productionDate);
        $this->assertInstanceOf(\Carbon\Carbon::class, $truck->serviceStartDate);
    }

    #[Test]
    public function it_casts_purchase_price_as_decimal()
    {
        $truck = Truck::factory()->create(['purchasePrice' => 150000.50]);

        $this->assertIsNumeric($truck->purchasePrice);
        $this->assertEquals('150000.50', $truck->purchasePrice);
        $this->assertEquals(150000.50, (float) $truck->purchasePrice);
    }

    #[Test]
    public function it_has_fillable_attributes()
    {
        $fillable = [
            'plate',
            'vehicletype_id',
            'chasisNumber',
            'engineNumber',
            'tyreSyze',
            'serviceIntervalKM',
            'purchasePrice',
            'productionDate',
            'serviceStartDate',
            'status',
        ];

        $truck = new Truck;
        $this->assertEquals($fillable, $truck->getFillable());
    }

    #[Test]
    public function it_can_scope_active_trucks()
    {
        Truck::factory()->create(['status' => 'active']);
        Truck::factory()->create(['status' => 'inactive']);
        Truck::factory()->create(['status' => 'maintenance']);

        $activeTrucks = Truck::where('status', 'active')->get();

        $this->assertCount(1, $activeTrucks);
        $this->assertEquals('active', $activeTrucks->first()->status);
    }

    #[Test]
    public function it_can_get_total_maintenance_cost()
    {
        $truck = Truck::factory()->create();
        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truck->id,
            'cost' => 1000.00,
        ]);
        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truck->id,
            'cost' => 500.00,
        ]);

        $totalCost = $truck->maintenanceRecords->sum('cost');

        $this->assertEquals(1500.00, $totalCost);
    }

    #[Test]
    public function it_can_get_total_fuel_cost()
    {
        $truck = Truck::factory()->create();
        FuelRecord::factory()->create([
            'truck_id' => $truck->id,
            'total_cost' => 200.00,
        ]);
        FuelRecord::factory()->create([
            'truck_id' => $truck->id,
            'total_cost' => 300.00,
        ]);

        $totalCost = $truck->fuelRecords->sum('total_cost');

        $this->assertEquals(500.00, $totalCost);
    }
}
