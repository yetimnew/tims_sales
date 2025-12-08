<?php

namespace Tests\Unit;

use App\Enums\CargoCategory;
use App\Models\CargoType;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\FuelRecord;
use App\Models\MaintenanceType;
use App\Models\Operation;
use App\Models\Region;
use App\Models\RoutePlan;
use App\Models\Truck;
use App\Models\TruckFinancialRecord;
use App\Models\User;
use App\Models\VehicleMaintenanceRecord;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TimsModelTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function vehicle_type_can_be_created()
    {
        $vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck',
        ]);

        $this->assertInstanceOf(VehicleType::class, $vehicleType);
        $this->assertEquals('Heavy Truck', $vehicleType->name);
        $this->assertEquals('Large cargo truck', $vehicleType->description);
    }

    #[Test]
    public function truck_can_be_created()
    {
        $vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck',
        ]);

        $truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012',
        ]);

        $this->assertInstanceOf(Truck::class, $truck);
        $this->assertEquals('AA-1234', $truck->plate);
        $this->assertEquals($vehicleType->id, $truck->vehicletype_id);
    }

    #[Test]
    public function truck_belongs_to_vehicle_type()
    {
        $vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck',
        ]);

        $truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ]);

        $this->assertInstanceOf(VehicleType::class, $truck->vehicleType);
        $this->assertEquals($vehicleType->id, $truck->vehicleType->id);
    }

    #[Test]
    public function vehicle_type_has_many_trucks()
    {
        $vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck',
        ]);

        $truck1 = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ]);

        $truck2 = Truck::create([
            'plate' => 'BB-5678',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ]);

        $this->assertCount(2, $vehicleType->trucks);
        $this->assertTrue($vehicleType->trucks->contains($truck1));
        $this->assertTrue($vehicleType->trucks->contains($truck2));
    }

    #[Test]
    public function driver_can_be_created()
    {
        $driver = Driver::create([
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'sex' => 'male',
            'status' => 'active',
            'zone' => 'ADDISE ABABA',
            'mobile' => '+251911234567',
        ]);

        $this->assertInstanceOf(Driver::class, $driver);
        $this->assertEquals('DRV001', $driver->driverid);
        $this->assertEquals('John Doe', $driver->name);
    }

    #[Test]
    public function customer_can_be_created()
    {
        $customer = Customer::create([
            'name' => 'ABC Transport',
            'contact_person' => 'Jane Smith',
            'phone' => '+251912345678',
            'email' => 'contact@abctransport.com',
            'status' => 'active',
        ]);

        $this->assertInstanceOf(Customer::class, $customer);
        $this->assertEquals('ABC Transport', $customer->name);
        $this->assertEquals('contact@abctransport.com', $customer->email);
    }

    #[Test]
    public function region_can_be_created()
    {
        $region = Region::create([
            'name' => 'ADDISE ABABA',
            'description' => 'Capital city region',
        ]);

        $this->assertInstanceOf(Region::class, $region);
        $this->assertEquals('ADDISE ABABA', $region->name);
    }

    #[Test]
    public function operation_can_be_created()
    {
        $user = User::factory()->create();
        $customer = Customer::create([
            'name' => 'ABC Transport',
            'contact_person' => 'Jane Smith',
            'phone' => '+251912345678',
            'email' => 'contact@abctransport.com',
            'status' => 'active',
        ]);
        $region = Region::create([
            'name' => 'ADDISE ABABA',
            'description' => 'Capital city region',
        ]);

        $cargoType = CargoType::create([
            'name' => 'General Cargo',
            'category' => CargoCategory::General->value,
            'weight_per_cubic_meter' => 1000,
            'handling_requirements' => 'Standard',
            'safety_requirements' => 'Standard',
            'requires_special_equipment' => false,
        ]);

        $operation = Operation::create([
            'operationid' => 'OP001',
            'customer_id' => $customer->id,
            'startdate' => '2025-01-01',
            'volume' => 100.00,
            'cargo_type_id' => $cargoType->id,
            'cargo_service_type' => 'commercial',
            'km' => 500.00,
            'tariff' => 50.00,
            'status' => 'active',
            'closed' => false,
            'destination_scope' => 'region',
            'destination_name' => $region->name,
            'destination_reference_type' => Region::class,
            'destination_reference_id' => $region->id,
            'user_id' => $user->id,
        ]);

        $this->assertInstanceOf(Operation::class, $operation);
        $this->assertEquals('OP001', $operation->operationid);
        $this->assertEquals($customer->id, $operation->customer_id);
    }

    #[Test]
    public function operation_belongs_to_customer()
    {
        $user = User::factory()->create();
        $customer = Customer::create([
            'name' => 'ABC Transport',
            'contact_person' => 'Jane Smith',
            'phone' => '+251912345678',
            'email' => 'contact@abctransport.com',
            'status' => 'active',
        ]);
        $region = Region::create([
            'name' => 'ADDISE ABABA',
            'description' => 'Capital city region',
        ]);

        $cargoType = CargoType::create([
            'name' => 'General Cargo',
            'category' => CargoCategory::General->value,
            'weight_per_cubic_meter' => 1000,
            'handling_requirements' => 'Standard',
            'safety_requirements' => 'Standard',
            'requires_special_equipment' => false,
        ]);

        $operation = Operation::create([
            'operationid' => 'OP001',
            'customer_id' => $customer->id,
            'startdate' => '2025-01-01',
            'volume' => 100.00,
            'cargo_type_id' => $cargoType->id,
            'cargo_service_type' => 'commercial',
            'km' => 500.00,
            'tariff' => 50.00,
            'status' => 'active',
            'closed' => false,
            'destination_scope' => 'region',
            'destination_name' => $region->name,
            'destination_reference_type' => Region::class,
            'destination_reference_id' => $region->id,
            'user_id' => $user->id,
        ]);

        $this->assertInstanceOf(Customer::class, $operation->customer);
        $this->assertEquals($customer->id, $operation->customer->id);
    }

    #[Test]
    public function maintenance_type_can_be_created()
    {
        $maintenanceType = MaintenanceType::create([
            'name' => 'Oil Change',
            'category' => 'Preventive',
            'description' => 'Regular oil change maintenance',
            'recommended_interval_km' => 10000,
            'estimated_duration_hours' => 2,
        ]);

        $this->assertInstanceOf(MaintenanceType::class, $maintenanceType);
        $this->assertEquals('Oil Change', $maintenanceType->name);
        $this->assertEquals('Preventive', $maintenanceType->category);
    }

    #[Test]
    public function maintenance_record_can_be_created()
    {
        $user = User::factory()->create();
        $vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck',
        ]);

        $truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ]);

        $maintenanceType = MaintenanceType::create([
            'name' => 'Oil Change',
            'category' => 'Preventive',
            'description' => 'Regular oil change maintenance',
            'recommended_interval_km' => 10000,
            'estimated_duration_hours' => 2,
        ]);

        $maintenanceRecord = VehicleMaintenanceRecord::create([
            'truck_id' => $truck->id,
            'maintenance_type_id' => $maintenanceType->id,
            'scheduled_date' => '2025-01-15',
            'status' => 'scheduled',
            'description' => 'Regular oil change',
            'cost' => 500.00,
            'assigned_mechanic_id' => $user->id,
            'user_id' => $user->id,
        ]);

        $this->assertInstanceOf(VehicleMaintenanceRecord::class, $maintenanceRecord);
        $this->assertEquals($truck->id, $maintenanceRecord->truck_id);
        $this->assertEquals($maintenanceType->id, $maintenanceRecord->maintenance_type_id);
    }

    #[Test]
    public function fuel_record_can_be_created()
    {
        $user = User::factory()->create();
        $vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck',
        ]);

        $truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ]);

        $driver = Driver::create([
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'sex' => 'male',
            'status' => 'active',
            'zone' => 'ADDISE ABABA',
            'mobile' => '+251911234567',
        ]);

        $fuelRecord = FuelRecord::create([
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'fuel_date' => '2025-01-10',
            'fuel_type' => 'diesel',
            'fuel_quantity_liters' => 200.00,
            'fuel_price_per_liter' => 45.00,
            'total_cost' => 9000.00,
            'odometer_reading' => 50000,
            'fuel_station' => 'Shell Station',
            'receipt_number' => 'RCPT-9000',
            'notes' => 'ADDISE ABABA',
            'user_id' => $user->id,
        ]);

        $this->assertInstanceOf(FuelRecord::class, $fuelRecord);
        $this->assertEquals($truck->id, $fuelRecord->truck_id);
        $this->assertEquals($driver->id, $fuelRecord->driver_id);
    }

    #[Test]
    public function cargo_type_can_be_created()
    {
        $cargoType = CargoType::create([
            'name' => 'Construction Materials',
            'category' => CargoCategory::Construction->value,
            'weight_per_cubic_meter' => 2500.00,
            'handling_requirements' => 'Special handling required',
            'safety_requirements' => 'Use appropriate PPE',
            'requires_special_equipment' => true,
        ]);

        $this->assertInstanceOf(CargoType::class, $cargoType);
        $this->assertEquals('Construction Materials', $cargoType->name);
        $this->assertTrue($cargoType->category === CargoCategory::Construction);
    }

    #[Test]
    public function financial_record_can_be_created()
    {
        $vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck',
        ]);

        $truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ]);

        $financialRecord = TruckFinancialRecord::create([
            'truck_id' => $truck->id,
            'record_date' => '2025-01-10',
            'period_type' => 'daily',
            'revenue' => 50000.00,
            'fuel_cost' => 9000.00,
            'maintenance_cost' => 2000.00,
            'driver_salary' => 3000.00,
            'insurance_cost' => 500.00,
            'depreciation' => 1000.00,
            'other_costs' => 500.00,
            'net_profit' => 34000.00,
        ]);

        $this->assertInstanceOf(TruckFinancialRecord::class, $financialRecord);
        $this->assertEquals($truck->id, $financialRecord->truck_id);
        $this->assertEquals(50000.00, $financialRecord->revenue);
    }

    #[Test]
    public function route_plan_can_be_created()
    {
        $user = User::factory()->create();
        $customer = Customer::create([
            'name' => 'ABC Transport',
            'contact_person' => 'Jane Smith',
            'phone' => '+251912345678',
            'email' => 'contact@abctransport.com',
            'status' => 'active',
        ]);
        $region = Region::create([
            'name' => 'ADDISE ABABA',
            'description' => 'Capital city region',
        ]);

        $cargoType = CargoType::create([
            'name' => 'General Cargo',
            'category' => CargoCategory::General->value,
            'weight_per_cubic_meter' => 1000,
            'handling_requirements' => 'Standard',
            'safety_requirements' => 'Standard',
            'requires_special_equipment' => false,
        ]);

        $operation = Operation::create([
            'operationid' => 'OP001',
            'customer_id' => $customer->id,
            'startdate' => '2025-01-01',
            'volume' => 100.00,
            'cargo_type_id' => $cargoType->id,
            'cargo_service_type' => 'commercial',
            'km' => 500.00,
            'tariff' => 50.00,
            'status' => 'active',
            'closed' => false,
            'destination_scope' => 'region',
            'destination_name' => $region->name,
            'destination_reference_type' => Region::class,
            'destination_reference_id' => $region->id,
            'user_id' => $user->id,
        ]);

        $vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck',
        ]);

        $truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ]);

        $driver = Driver::create([
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'sex' => 'male',
            'status' => 'active',
            'zone' => 'ADDISE ABABA',
            'mobile' => '+251911234567',
        ]);

        $routePlan = RoutePlan::create([
            'operation_id' => $operation->id,
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'planned_date' => '2025-01-15',
            'planned_departure_time' => '08:00:00',
            'planned_arrival_time' => '16:00:00',
            'route_waypoints' => json_encode([
                ['name' => 'ADDISE ABABA'],
                ['name' => 'Dire Dawa'],
            ]),
            'total_distance_km' => 500.00,
            'total_travel_time_minutes' => 480,
            'estimated_fuel_cost' => 2500.00,
            'origin' => 'ADDISE ABABA',
            'destination' => 'Dire Dawa',
            'estimated_distance_km' => 500.00,
            'estimated_travel_time_hours' => 8,
            'status' => 'planned',
            'notes' => 'Regular route plan',
            'user_id' => $user->id,
        ]);

        $this->assertInstanceOf(RoutePlan::class, $routePlan);
        $this->assertEquals($operation->id, $routePlan->operation_id);
        $this->assertEquals($truck->id, $routePlan->truck_id);
        $this->assertEquals($driver->id, $routePlan->driver_id);
    }

    #[Test]
    public function models_use_soft_deletes()
    {
        $vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck',
        ]);

        $truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ]);

        // Soft delete the truck
        $truck->delete();

        // Verify it's soft deleted
        $this->assertSoftDeleted('trucks', ['id' => $truck->id]);

        // Verify it doesn't appear in normal queries
        $this->assertDatabaseMissing('trucks', [
            'id' => $truck->id,
            'deleted_at' => null,
        ]);
    }

    #[Test]
    public function models_have_correct_fillable_attributes()
    {
        $vehicleType = new VehicleType;
        $this->assertContains('name', $vehicleType->getFillable());
        $this->assertContains('description', $vehicleType->getFillable());

        $truck = new Truck;
        $this->assertContains('plate', $truck->getFillable());
        $this->assertContains('vehicletype_id', $truck->getFillable());
        $this->assertContains('status', $truck->getFillable());

        $driver = new Driver;
        $this->assertContains('driverid', $driver->getFillable());
        $this->assertContains('name', $driver->getFillable());
        $this->assertContains('sex', $driver->getFillable());
    }

    #[Test]
    public function models_have_correct_casts()
    {
        $truck = new Truck;
        $this->assertArrayHasKey('purchasePrice', $truck->getCasts());
        $this->assertEquals('decimal:2', $truck->getCasts()['purchasePrice']);

        $driver = new Driver;
        $this->assertArrayHasKey('birthdate', $driver->getCasts());
        $this->assertEquals('date', $driver->getCasts()['birthdate']);

        $operation = new Operation;
        $this->assertArrayHasKey('startdate', $operation->getCasts());
        $this->assertEquals('date', $operation->getCasts()['startdate']);
    }
}
