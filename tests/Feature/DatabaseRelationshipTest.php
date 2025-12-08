<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Distance;
use App\Models\Driver;
use App\Models\FuelRecord;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Place;
use App\Models\Region;
use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleMaintenanceRecord;
use App\Models\VehicleType;
use App\Models\Woreda;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DatabaseRelationshipTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function truck_belongs_to_vehicle_type()
    {
        $vehicleType = VehicleType::factory()->create();
        $truck = Truck::factory()->create(['vehicletype_id' => $vehicleType->id]);

        $this->assertInstanceOf(VehicleType::class, $truck->vehicleType);
        $this->assertEquals($vehicleType->id, $truck->vehicleType->id);
    }

    #[Test]
    public function truck_has_many_drivers_through_pivot()
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
    public function driver_has_many_trucks_through_pivot()
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
    public function truck_has_many_maintenance_records()
    {
        $truck = Truck::factory()->create();
        VehicleMaintenanceRecord::factory()->count(3)->create(['truck_id' => $truck->id]);

        $this->assertCount(3, $truck->maintenanceRecords);
        $this->assertInstanceOf(VehicleMaintenanceRecord::class, $truck->maintenanceRecords->first());
    }

    #[Test]
    public function truck_has_many_fuel_records()
    {
        $truck = Truck::factory()->create();
        FuelRecord::factory()->count(5)->create(['truck_id' => $truck->id]);

        $this->assertCount(5, $truck->fuelRecords);
        $this->assertInstanceOf(FuelRecord::class, $truck->fuelRecords->first());
    }

    #[Test]
    public function driver_belongs_to_zone()
    {
        $zone = Zone::factory()->create();
        $driver = Driver::factory()->create(['zone_id' => $zone->id]);

        $this->assertInstanceOf(Zone::class, $driver->zone);
        $this->assertEquals($zone->id, $driver->zone->id);
    }

    #[Test]
    public function driver_belongs_to_woreda()
    {
        $woreda = Woreda::factory()->create();
        $driver = Driver::factory()->create(['woreda_id' => $woreda->id]);

        $this->assertInstanceOf(Woreda::class, $driver->woreda);
        $this->assertEquals($woreda->id, $driver->woreda->id);
    }

    #[Test]
    public function zone_belongs_to_region()
    {
        $region = Region::factory()->create();
        $zone = Zone::factory()->create(['region_id' => $region->id]);

        $this->assertInstanceOf(Region::class, $zone->region);
        $this->assertEquals($region->id, $zone->region->id);
    }

    #[Test]
    public function woreda_belongs_to_zone()
    {
        $zone = Zone::factory()->create();
        $woreda = Woreda::factory()->create(['zone_id' => $zone->id]);

        $this->assertInstanceOf(Zone::class, $woreda->zone);
        $this->assertEquals($zone->id, $woreda->zone->id);
    }

    #[Test]
    public function place_belongs_to_woreda()
    {
        $woreda = Woreda::factory()->create();
        $place = Place::factory()->create(['woreda_id' => $woreda->id]);

        $this->assertInstanceOf(Woreda::class, $place->woreda);
        $this->assertEquals($woreda->id, $place->woreda->id);
    }

    #[Test]
    public function region_has_many_zones()
    {
        $region = Region::factory()->create();
        Zone::factory()->count(3)->create(['region_id' => $region->id]);

        $this->assertCount(3, $region->zones);
        $this->assertInstanceOf(Zone::class, $region->zones->first());
    }

    #[Test]
    public function zone_has_many_woredas()
    {
        $zone = Zone::factory()->create();
        Woreda::factory()->count(4)->create(['zone_id' => $zone->id]);

        $this->assertCount(4, $zone->woredas);
        $this->assertInstanceOf(Woreda::class, $zone->woredas->first());
    }

    #[Test]
    public function woreda_has_many_places()
    {
        $woreda = Woreda::factory()->create();
        Place::factory()->count(5)->create(['woreda_id' => $woreda->id]);

        $this->assertCount(5, $woreda->places);
        $this->assertInstanceOf(Place::class, $woreda->places->first());
    }

    #[Test]
    public function performance_belongs_to_operation()
    {
        $operation = Operation::factory()->create();
        $performance = Performance::factory()->create(['operation_id' => $operation->id]);

        $this->assertInstanceOf(Operation::class, $performance->operation);
        $this->assertEquals($operation->id, $performance->operation->id);
    }

    #[Test]
    public function operation_belongs_to_customer()
    {
        $customer = Customer::factory()->create();
        $operation = Operation::factory()->create(['customer_id' => $customer->id]);

        $this->assertInstanceOf(Customer::class, $operation->customer);
        $this->assertEquals($customer->id, $operation->customer->id);
    }

    #[Test]
    public function customer_has_many_operations()
    {
        $customer = Customer::factory()->create();
        Operation::factory()->count(3)->create(['customer_id' => $customer->id]);

        $this->assertCount(3, $customer->operations);
        $this->assertInstanceOf(Operation::class, $customer->operations->first());
    }

    #[Test]
    public function operation_has_many_performances()
    {
        $operation = Operation::factory()->create();
        Performance::factory()->count(2)->create(['operation_id' => $operation->id]);

        $this->assertCount(2, $operation->performances);
        $this->assertInstanceOf(Performance::class, $operation->performances->first());
    }

    #[Test]
    public function performance_belongs_to_origin_place()
    {
        $place = Place::factory()->create();
        $performance = Performance::factory()->create(['orgion_id' => $place->id]);

        $this->assertInstanceOf(Place::class, $performance->origin);
        $this->assertEquals($place->id, $performance->origin->id);
    }

    #[Test]
    public function performance_belongs_to_destination_place()
    {
        $place = Place::factory()->create();
        $performance = Performance::factory()->create(['destination_id' => $place->id]);

        $this->assertInstanceOf(Place::class, $performance->destination);
        $this->assertEquals($place->id, $performance->destination->id);
    }

    #[Test]
    public function distance_belongs_to_origin_place()
    {
        $place = Place::factory()->create();
        $distance = Distance::factory()->create(['origin_id' => $place->id]);

        $this->assertInstanceOf(Place::class, $distance->origin);
        $this->assertEquals($place->id, $distance->origin->id);
    }

    #[Test]
    public function distance_belongs_to_destination_place()
    {
        $place = Place::factory()->create();
        $distance = Distance::factory()->create(['destination_id' => $place->id]);

        $this->assertInstanceOf(Place::class, $distance->destination);
        $this->assertEquals($place->id, $distance->destination->id);
    }

    #[Test]
    public function user_has_many_performances()
    {
        $user = User::factory()->create();
        Performance::factory()->count(3)->create(['user_id' => $user->id]);

        $this->assertCount(3, $user->performances);
        $this->assertInstanceOf(Performance::class, $user->performances->first());
    }

    #[Test]
    public function user_has_many_operations()
    {
        $user = User::factory()->create();
        Operation::factory()->count(2)->create(['user_id' => $user->id]);

        $this->assertCount(2, $user->operations);
        $this->assertInstanceOf(Operation::class, $user->operations->first());
    }

    #[Test]
    public function vehicle_type_has_many_trucks()
    {
        $vehicleType = VehicleType::factory()->create();
        Truck::factory()->count(4)->create(['vehicletype_id' => $vehicleType->id]);

        $this->assertCount(4, $vehicleType->trucks);
        $this->assertInstanceOf(Truck::class, $vehicleType->trucks->first());
    }

    #[Test]
    public function zone_has_many_drivers()
    {
        $zone = Zone::factory()->create();
        Driver::factory()->count(3)->create(['zone_id' => $zone->id]);

        $this->assertCount(3, $zone->drivers);
        $this->assertInstanceOf(Driver::class, $zone->drivers->first());
    }

    #[Test]
    public function woreda_has_many_drivers()
    {
        $woreda = Woreda::factory()->create();
        Driver::factory()->count(2)->create(['woreda_id' => $woreda->id]);

        $this->assertCount(2, $woreda->drivers);
        $this->assertInstanceOf(Driver::class, $woreda->drivers->first());
    }

    #[Test]
    public function pivot_table_has_correct_data()
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        $truck->drivers()->attach($driver->id, [
            'assigned_date' => now(),
            'unassigned_date' => null,
            'status' => 'active',
        ]);

        $pivot = $truck->drivers()->where('driver_id', $driver->id)->first()->pivot;

        $this->assertEquals($truck->id, $pivot->truck_id);
        $this->assertEquals($driver->id, $pivot->driver_id);
        $this->assertEquals('active', $pivot->status);
        $this->assertNotNull($pivot->assigned_date);
        $this->assertNull($pivot->unassigned_date);
    }

    #[Test]
    public function relationship_cascading_deletes()
    {
        $region = Region::factory()->create();
        $zone = Zone::factory()->create(['region_id' => $region->id]);
        $woreda = Woreda::factory()->create(['zone_id' => $zone->id]);
        $place = Place::factory()->create(['woreda_id' => $woreda->id]);

        // Test that deleting region doesn't cascade (if not configured)
        $regionId = $region->id;
        $region->delete();

        $this->assertSoftDeleted('regions', ['id' => $regionId]);
        $this->assertDatabaseHas('zones', ['id' => $zone->id]);
        $this->assertDatabaseHas('woredas', ['id' => $woreda->id]);
        $this->assertDatabaseHas('places', ['id' => $place->id]);
    }

    #[Test]
    public function relationship_with_count()
    {
        $vehicleType = VehicleType::factory()->create();
        Truck::factory()->count(5)->create(['vehicletype_id' => $vehicleType->id]);

        $vehicleTypeWithCount = VehicleType::withCount('trucks')->find($vehicleType->id);

        $this->assertEquals(5, $vehicleTypeWithCount->trucks_count);
    }

    #[Test]
    public function relationship_with_aggregates()
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

        $truckWithSum = Truck::withSum('maintenanceRecords', 'cost')->find($truck->id);

        $this->assertEquals(1500.00, $truckWithSum->maintenance_records_sum_cost);
    }

    #[Test]
    public function relationship_with_max()
    {
        $truck = Truck::factory()->create();
        FuelRecord::factory()->create([
            'truck_id' => $truck->id,
            'fuel_quantity_liters' => 50.0,
        ]);
        FuelRecord::factory()->create([
            'truck_id' => $truck->id,
            'fuel_quantity_liters' => 75.0,
        ]);

        $truckWithMax = Truck::withMax('fuelRecords', 'fuel_quantity_liters')->find($truck->id);

        $this->assertEquals(75.0, $truckWithMax->fuel_records_max_fuel_quantity_liters);
    }

    #[Test]
    public function relationship_with_min()
    {
        $truck = Truck::factory()->create();
        FuelRecord::factory()->create([
            'truck_id' => $truck->id,
            'fuel_quantity_liters' => 50.0,
        ]);
        FuelRecord::factory()->create([
            'truck_id' => $truck->id,
            'fuel_quantity_liters' => 75.0,
        ]);

        $truckWithMin = Truck::withMin('fuelRecords', 'fuel_quantity_liters')->find($truck->id);

        $this->assertEquals(50.0, $truckWithMin->fuel_records_min_fuel_quantity_liters);
    }

    #[Test]
    public function relationship_with_avg()
    {
        $truck = Truck::factory()->create();
        FuelRecord::factory()->create([
            'truck_id' => $truck->id,
            'fuel_quantity_liters' => 50.0,
        ]);
        FuelRecord::factory()->create([
            'truck_id' => $truck->id,
            'fuel_quantity_liters' => 75.0,
        ]);

        $truckWithAvg = Truck::withAvg('fuelRecords', 'fuel_quantity_liters')->find($truck->id);

        $this->assertEquals(62.5, $truckWithAvg->fuel_records_avg_fuel_quantity_liters);
    }

    #[Test]
    public function relationship_loading_with_constraints()
    {
        $truck = Truck::factory()->create();
        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truck->id,
            'status' => 'completed',
        ]);
        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truck->id,
            'status' => 'pending',
        ]);

        $truckWithCompletedMaintenance = Truck::with(['maintenanceRecords' => function ($query) {
            $query->where('status', 'completed');
        }])->find($truck->id);

        $this->assertCount(1, $truckWithCompletedMaintenance->maintenanceRecords);
        $this->assertEquals('completed', $truckWithCompletedMaintenance->maintenanceRecords->first()->status);
    }

    #[Test]
    public function relationship_loading_with_ordering()
    {
        $truck = Truck::factory()->create();
        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truck->id,
            'scheduled_date' => '2023-01-01',
        ]);
        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truck->id,
            'scheduled_date' => '2023-01-03',
        ]);
        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truck->id,
            'scheduled_date' => '2023-01-02',
        ]);

        $truckWithOrderedMaintenance = Truck::with(['maintenanceRecords' => function ($query) {
            $query->orderBy('scheduled_date', 'desc');
        }])->find($truck->id);

        $dates = $truckWithOrderedMaintenance->maintenanceRecords->pluck('scheduled_date')->toArray();
        $this->assertEquals(['2023-01-03', '2023-01-02', '2023-01-01'], $dates);
    }
}
