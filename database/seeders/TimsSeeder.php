<?php

namespace Database\Seeders;

use App\Enums\CargoCategory;
use App\Enums\OperationDestinationScope;
use App\Models\CargoType;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\DriverPerformanceRecord;
use App\Models\DriverSafetyRecord;
use App\Models\DriverTruck;
use App\Models\FuelRecord;
use App\Models\InsuranceRecord;
use App\Models\MaintenanceType;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Place;
use App\Models\Region;
use App\Models\RoutePlan;
use App\Models\Truck;
use App\Models\TruckFinancialRecord;
use App\Models\User;
use App\Models\VehicleMaintenanceRecord;
use App\Models\VehicleType;
use App\Models\Woreda;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class TimsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting TIMS database seeding...');

        // Create users first
        $users = $this->createUsers();

        // Create geographic data
        $regions = $this->createRegions();
        $zones = $this->createZones($regions);
        $woredas = $this->createWoredas($zones);
        $places = $this->createPlaces($woredas);

        // Create vehicle types
        $vehicleTypes = $this->createVehicleTypes();

        // Create trucks
        $trucks = $this->createTrucks($vehicleTypes);

        // Create drivers
        $drivers = $this->createDrivers();

        // Create driver-truck assignments
        $driverTrucks = $this->createDriverTruckAssignments($drivers, $trucks);

        // Create customers
        $customers = $this->createCustomers();

        // Create cargo types
        $cargoTypes = $this->createCargoTypes();

        // Create operations
        $operations = $this->createOperations($customers, $users, $regions, $zones, $woredas, $places, $cargoTypes);

        // Create performances
        $performances = $this->createPerformances($operations, $driverTrucks, $places, $users, $cargoTypes);

        $this->command->info('TIMS database seeding completed successfully!');
    }

    private function createUsers()
    {
        $this->command->info('Creating users...');

        $users = collect([
            [
                'name' => 'Admin User',
                'email' => 'admin@tims.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Manager User',
                'email' => 'manager@tims.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Dispatcher User',
                'email' => 'dispatcher@tims.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        ]);

        return $users->map(function ($userData) {
            return User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        });
    }

    private function createRegions()
    {
        $this->command->info('Creating regions...');

        $regions = collect([
            ['name' => 'Addis Ababa', 'code' => 'AA', 'description' => 'Capital city'],
            ['name' => 'Oromia', 'code' => 'OR', 'description' => 'Oromia region'],
            ['name' => 'Amhara', 'code' => 'AM', 'description' => 'Amhara region'],
            ['name' => 'SNNPR', 'code' => 'SN', 'description' => 'Southern Nations, Nationalities, and Peoples Region'],
            ['name' => 'Tigray', 'code' => 'TI', 'description' => 'Tigray region'],
        ]);

        return $regions->map(function ($regionData) {
            return Region::firstOrCreate(
                ['code' => $regionData['code']],
                $regionData
            );
        });
    }

    private function createZones($regions)
    {
        $this->command->info('Creating zones...');

        $zones = collect([
            ['name' => 'Addis Ababa Zone', 'code' => 'AAZ', 'region_id' => $regions->where('code', 'AA')->first()->id],
            ['name' => 'West Shewa', 'code' => 'WS', 'region_id' => $regions->where('code', 'OR')->first()->id],
            ['name' => 'East Shewa', 'code' => 'ES', 'region_id' => $regions->where('code', 'OR')->first()->id],
            ['name' => 'North Shewa', 'code' => 'NS', 'region_id' => $regions->where('code', 'AM')->first()->id],
            ['name' => 'South Gondar', 'code' => 'SG', 'region_id' => $regions->where('code', 'AM')->first()->id],
        ]);

        return $zones->map(function ($zoneData) {
            return Zone::firstOrCreate(
                ['code' => $zoneData['code']],
                $zoneData
            );
        });
    }

    private function createWoredas($zones)
    {
        $this->command->info('Creating woredas...');

        $woredas = collect([
            ['name' => 'Bole', 'code' => 'BOL', 'zone_id' => $zones->where('code', 'AAZ')->first()->id],
            ['name' => 'Kirkos', 'code' => 'KIR', 'zone_id' => $zones->where('code', 'AAZ')->first()->id],
            ['name' => 'Addis Ketema', 'code' => 'ADK', 'zone_id' => $zones->where('code', 'AAZ')->first()->id],
            ['name' => 'Ambo', 'code' => 'AMB', 'zone_id' => $zones->where('code', 'WS')->first()->id],
            ['name' => 'Debre Berhan', 'code' => 'DBB', 'zone_id' => $zones->where('code', 'NS')->first()->id],
            ['name' => 'Adama', 'code' => 'ADA', 'zone_id' => $zones->where('code', 'ES')->first()->id],
            ['name' => 'Bahir Dar', 'code' => 'BHD', 'zone_id' => $zones->where('code', 'SG')->first()->id],
        ]);

        return $woredas->map(function ($woredaData) {
            return Woreda::firstOrCreate(
                ['code' => $woredaData['code']],
                $woredaData
            );
        });
    }

    private function createPlaces($woredas)
    {
        $this->command->info('Creating places...');

        $places = collect([
            ['name' => 'Bole Airport', 'code' => 'BOL-AIR', 'woreda_id' => $woredas->where('code', 'BOL')->first()->id, 'latitude' => 8.9779, 'longitude' => 38.7993],
            ['name' => 'Mercato', 'code' => 'MER', 'woreda_id' => $woredas->where('code', 'ADK')->first()->id, 'latitude' => 9.0249, 'longitude' => 38.7469],
            ['name' => 'Piazza', 'code' => 'PIA', 'woreda_id' => $woredas->where('code', 'KIR')->first()->id, 'latitude' => 9.0367, 'longitude' => 38.7525],
            ['name' => 'Ambo Town', 'code' => 'AMB-TWN', 'woreda_id' => $woredas->where('code', 'AMB')->first()->id, 'latitude' => 8.9833, 'longitude' => 37.8500],
            ['name' => 'Debre Berhan Town', 'code' => 'DBB-TWN', 'woreda_id' => $woredas->where('code', 'DBB')->first()->id, 'latitude' => 9.6833, 'longitude' => 39.5333],
            ['name' => 'Adama', 'code' => 'ADA', 'woreda_id' => $woredas->where('code', 'ADA')->first()->id, 'latitude' => 8.5500, 'longitude' => 39.2667],
            ['name' => 'Bahir Dar', 'code' => 'BHD', 'woreda_id' => $woredas->where('code', 'BHD')->first()->id, 'latitude' => 11.6000, 'longitude' => 37.3833],
        ]);

        return $places->map(function ($placeData) {
            return Place::firstOrCreate(
                ['code' => $placeData['code']],
                $placeData
            );
        });
    }

    private function createVehicleTypes()
    {
        $this->command->info('Creating vehicle types...');

        $vehicleTypes = collect([
            ['name' => 'Heavy Truck', 'description' => 'Heavy duty truck for long distance transportation'],
            ['name' => 'Medium Truck', 'description' => 'Medium duty truck for regional transportation'],
            ['name' => 'Light Truck', 'description' => 'Light duty truck for local transportation'],
            ['name' => 'Trailer', 'description' => 'Trailer for heavy cargo transportation'],
            ['name' => 'Tanker', 'description' => 'Tanker truck for liquid cargo'],
        ]);

        return $vehicleTypes->map(function ($vehicleTypeData) {
            return VehicleType::firstOrCreate(
                ['name' => $vehicleTypeData['name']],
                $vehicleTypeData
            );
        });
    }

    private function createTrucks($vehicleTypes)
    {
        $this->command->info('Creating trucks...');

        $trucks = collect([
            [
                'plate' => 'AA-12345',
                'vehicletype_id' => $vehicleTypes->where('name', 'Heavy Truck')->first()->id,
                'chasisNumber' => 'CHS001',
                'engineNumber' => 'ENG001',
                'tyreSyze' => '12.00R20',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 2500000.00,
                'productionDate' => now()->subYears(2),
                'serviceStartDate' => now()->subYear(),
                'status' => 'active',
            ],
            [
                'plate' => 'AA-67890',
                'vehicletype_id' => $vehicleTypes->where('name', 'Medium Truck')->first()->id,
                'chasisNumber' => 'CHS002',
                'engineNumber' => 'ENG002',
                'tyreSyze' => '11.00R20',
                'serviceIntervalKM' => 8000,
                'purchasePrice' => 1800000.00,
                'productionDate' => now()->subYear(),
                'serviceStartDate' => now()->subMonths(6),
                'status' => 'active',
            ],
            [
                'plate' => 'AA-11111',
                'vehicletype_id' => $vehicleTypes->where('name', 'Trailer')->first()->id,
                'chasisNumber' => 'CHS003',
                'engineNumber' => 'ENG003',
                'tyreSyze' => '13.00R20',
                'serviceIntervalKM' => 12000,
                'purchasePrice' => 3200000.00,
                'productionDate' => now()->subMonths(18),
                'serviceStartDate' => now()->subMonths(12),
                'status' => 'active',
            ],
            [
                'plate' => 'AA-22222',
                'vehicletype_id' => $vehicleTypes->where('name', 'Tanker')->first()->id,
                'chasisNumber' => 'CHS004',
                'engineNumber' => 'ENG004',
                'tyreSyze' => '12.00R20',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 2800000.00,
                'productionDate' => now()->subMonths(24),
                'serviceStartDate' => now()->subMonths(18),
                'status' => 'maintenance',
            ],
            [
                'plate' => 'AA-33333',
                'vehicletype_id' => $vehicleTypes->where('name', 'Light Truck')->first()->id,
                'chasisNumber' => 'CHS005',
                'engineNumber' => 'ENG005',
                'tyreSyze' => '10.00R20',
                'serviceIntervalKM' => 6000,
                'purchasePrice' => 1200000.00,
                'productionDate' => now()->subMonths(6),
                'serviceStartDate' => now()->subMonths(3),
                'status' => 'active',
            ],
        ]);

        return $trucks->map(function ($truckData) {
            return Truck::firstOrCreate(
                ['plate' => $truckData['plate']],
                $truckData
            );
        });
    }

    private function createDrivers()
    {
        $this->command->info('Creating drivers...');

        $drivers = collect([
            [
                'driverid' => 'DRV001',
                'name' => 'Alemayehu Bekele',
                'sex' => 'Male',
                'birthdate' => now()->subYears(35),
                'zone' => 'Addis Ababa',
                'woreda' => 'Bole',
                'kebele' => '01',
                'housenumber' => '123',
                'mobile' => '0912345678',
                'hireddate' => now()->subYears(3),
                'status' => 'active',
            ],
            [
                'driverid' => 'DRV002',
                'name' => 'Tigist Hailu',
                'sex' => 'Female',
                'birthdate' => now()->subYears(28),
                'zone' => 'Addis Ababa',
                'woreda' => 'Kirkos',
                'kebele' => '05',
                'housenumber' => '456',
                'mobile' => '0918765432',
                'hireddate' => now()->subYears(2),
                'status' => 'active',
            ],
            [
                'driverid' => 'DRV003',
                'name' => 'Mengistu Tadesse',
                'sex' => 'Male',
                'birthdate' => now()->subYears(42),
                'zone' => 'Oromia',
                'woreda' => 'Ambo',
                'kebele' => '03',
                'housenumber' => '789',
                'mobile' => '0923456789',
                'hireddate' => now()->subYears(5),
                'status' => 'active',
            ],
            [
                'driverid' => 'DRV004',
                'name' => 'Sara Mohammed',
                'sex' => 'Female',
                'birthdate' => now()->subYears(31),
                'zone' => 'Amhara',
                'woreda' => 'Debre Berhan',
                'kebele' => '02',
                'housenumber' => '321',
                'mobile' => '0934567890',
                'hireddate' => now()->subMonths(18),
                'status' => 'active',
            ],
            [
                'driverid' => 'DRV005',
                'name' => 'Yonas Assefa',
                'sex' => 'Male',
                'birthdate' => now()->subYears(38),
                'zone' => 'Addis Ababa',
                'woreda' => 'Addis Ketema',
                'kebele' => '07',
                'housenumber' => '654',
                'mobile' => '0945678901',
                'hireddate' => now()->subMonths(6),
                'status' => 'inactive',
            ],
        ]);

        return $drivers->map(function ($driverData) {
            return Driver::firstOrCreate(
                ['driverid' => $driverData['driverid']],
                $driverData
            );
        });
    }

    private function createDriverTruckAssignments($drivers, $trucks)
    {
        $this->command->info('Creating driver-truck assignments...');

        $assignments = collect([
            [
                'driver_id' => $drivers->where('driverid', 'DRV001')->first()->id,
                'truck_id' => $trucks->where('plate', 'AA-12345')->first()->id,
                'assigned_date' => now()->subMonths(6),
                'status' => 'active',
            ],
            [
                'driver_id' => $drivers->where('driverid', 'DRV002')->first()->id,
                'truck_id' => $trucks->where('plate', 'AA-67890')->first()->id,
                'assigned_date' => now()->subMonths(4),
                'status' => 'active',
            ],
            [
                'driver_id' => $drivers->where('driverid', 'DRV003')->first()->id,
                'truck_id' => $trucks->where('plate', 'AA-11111')->first()->id,
                'assigned_date' => now()->subMonths(8),
                'status' => 'active',
            ],
            [
                'driver_id' => $drivers->where('driverid', 'DRV004')->first()->id,
                'truck_id' => $trucks->where('plate', 'AA-33333')->first()->id,
                'assigned_date' => now()->subMonths(2),
                'status' => 'active',
            ],
        ]);

        return $assignments->map(function ($assignmentData) {
            return DriverTruck::firstOrCreate(
                [
                    'driver_id' => $assignmentData['driver_id'],
                    'truck_id' => $assignmentData['truck_id'],
                ],
                $assignmentData
            );
        });
    }

    private function createCustomers()
    {
        $this->command->info('Creating customers...');

        $customers = collect([
            [
                'name' => 'Ethiopian Airlines',
                'contact_person' => 'John Smith',
                'phone' => '011-123-4567',
                'email' => 'cargo@ethiopianairlines.com',
                'address' => 'Bole Airport, Addis Ababa',
                'status' => 'active',
            ],
            [
                'name' => 'Dashen Brewery',
                'contact_person' => 'Sarah Johnson',
                'phone' => '011-234-5678',
                'email' => 'logistics@dashenbrewery.com',
                'address' => 'Addis Ababa Industrial Zone',
                'status' => 'active',
            ],
            [
                'name' => 'East Africa Bottling',
                'contact_person' => 'Michael Brown',
                'phone' => '011-345-6789',
                'email' => 'transport@eab.com',
                'address' => 'Adama Industrial Park',
                'status' => 'active',
            ],
            [
                'name' => 'National Oil Company',
                'contact_person' => 'Lisa Davis',
                'phone' => '011-456-7890',
                'email' => 'distribution@noc.com',
                'address' => 'Bahir Dar Refinery',
                'status' => 'active',
            ],
            [
                'name' => 'Construction Materials Ltd',
                'contact_person' => 'Robert Wilson',
                'phone' => '011-567-8901',
                'email' => 'supply@conmat.com',
                'address' => 'Debre Berhan Industrial Area',
                'status' => 'active',
            ],
        ]);

        return $customers->map(function ($customerData) {
            return Customer::firstOrCreate(
                ['name' => $customerData['name']],
                $customerData
            );
        });
    }

    private function createOperations($customers, $users, $regions, $zones, $woredas, $places, $cargoTypes)
    {
        $this->command->info('Creating operations...');

        $addisRegion = $regions->where('code', 'AA')->first();
        $westShewaZone = $zones->where('code', 'WS')->first();
        $adamaWoreda = $woredas->where('code', 'ADA')->first();
        $bahirDarPlace = $places->where('code', 'BHD')->first();

        $operations = collect([
            array_merge([
                'operationid' => 'OP001',
                'customer_id' => $customers->where('name', 'Ethiopian Airlines')->first()->id,
                'user_id' => $users->first()->id,
                'startdate' => now()->subDays(30),
                'enddate' => now()->addDays(30),
                'volume' => 5000.00,
                'cargo_type_id' => $cargoTypes->where('name', 'General Cargo')->first()->id,
                'cargo_service_type' => 'commercial',
                'km' => 1200.00,
                'tariff' => 15.50,
                'closed' => false,
                'status' => 'active',
            ], $this->buildDestinationAttributes($addisRegion, OperationDestinationScope::Region)),
            array_merge([
                'operationid' => 'OP002',
                'customer_id' => $customers->where('name', 'Dashen Brewery')->first()->id,
                'user_id' => $users->first()->id,
                'startdate' => now()->subDays(15),
                'enddate' => now()->addDays(45),
                'volume' => 3000.00,
                'cargo_type_id' => $cargoTypes->where('name', 'Food & Beverages')->first()->id,
                'cargo_service_type' => 'commercial',
                'km' => 800.00,
                'tariff' => 12.75,
                'closed' => false,
                'status' => 'active',
            ], $this->buildDestinationAttributes($westShewaZone, OperationDestinationScope::Zone)),
            array_merge([
                'operationid' => 'OP003',
                'customer_id' => $customers->where('name', 'East Africa Bottling')->first()->id,
                'user_id' => $users->first()->id,
                'startdate' => now()->subDays(60),
                'enddate' => now()->subDays(30),
                'volume' => 2000.00,
                'cargo_type_id' => $cargoTypes->where('name', 'Food & Beverages')->first()->id,
                'cargo_service_type' => 'commercial',
                'km' => 600.00,
                'tariff' => 14.25,
                'closed' => true,
                'status' => 'completed',
            ], $this->buildDestinationAttributes($adamaWoreda, OperationDestinationScope::Woreda)),
            array_merge([
                'operationid' => 'OP004',
                'customer_id' => $customers->where('name', 'National Oil Company')->first()->id,
                'user_id' => $users->first()->id,
                'startdate' => now()->subDays(45),
                'enddate' => now()->addDays(15),
                'volume' => 8000.00,
                'cargo_type_id' => $cargoTypes->where('name', 'Fuel & Chemicals')->first()->id,
                'cargo_service_type' => 'relief',
                'km' => 1500.00,
                'tariff' => 18.00,
                'closed' => false,
                'status' => 'active',
            ], $this->buildDestinationAttributes($bahirDarPlace, OperationDestinationScope::Place)),
        ]);

        return $operations->map(function ($operationData) {
            return Operation::updateOrCreate(
                ['operationid' => $operationData['operationid']],
                $operationData
            );
        });
    }

    private function buildDestinationAttributes(?Model $model, OperationDestinationScope $scope): array
    {
        if (! $model) {
            throw new RuntimeException('Failed to resolve destination reference for operations seeder.');
        }

        $name = $model->name ?? (string) $model->getKey();

        return [
            'destination_scope' => $scope->value,
            'destination_name' => $name,
            'destination_reference_type' => $model::class,
            'destination_reference_id' => $model->getKey(),
        ];
    }

    private function createCargoTypes()
    {
        $this->command->info('Creating cargo types...');

        $cargoTypes = collect([
            [
                'name' => 'General Cargo',
                'category' => CargoCategory::General->value,
                'weight_per_cubic_meter' => 1000.00,
                'handling_requirements' => 'Standard handling procedures',
                'safety_requirements' => 'Basic safety protocols',
                'requires_special_equipment' => false,
            ],
            [
                'name' => 'Construction Materials',
                'category' => CargoCategory::Construction->value,
                'weight_per_cubic_meter' => 2500.00,
                'handling_requirements' => 'Heavy lifting equipment required',
                'safety_requirements' => 'Hard hat and safety boots mandatory',
                'requires_special_equipment' => true,
            ],
            [
                'name' => 'Food & Beverages',
                'category' => CargoCategory::Food->value,
                'weight_per_cubic_meter' => 800.00,
                'handling_requirements' => 'Temperature controlled transport',
                'safety_requirements' => 'Food safety protocols',
                'requires_special_equipment' => true,
            ],
            [
                'name' => 'Fuel & Chemicals',
                'category' => CargoCategory::Industrial->value,
                'weight_per_cubic_meter' => 900.00,
                'handling_requirements' => 'Hazardous material handling',
                'safety_requirements' => 'Fire safety equipment required',
                'requires_special_equipment' => true,
            ],
            [
                'name' => 'Machinery & Equipment',
                'category' => CargoCategory::Industrial->value,
                'weight_per_cubic_meter' => 3000.00,
                'handling_requirements' => 'Crane and specialized equipment',
                'safety_requirements' => 'Heavy machinery safety protocols',
                'requires_special_equipment' => true,
            ],
            [
                'name' => 'Agricultural Products',
                'category' => CargoCategory::Agricultural->value,
                'weight_per_cubic_meter' => 600.00,
                'handling_requirements' => 'Dry storage requirements',
                'safety_requirements' => 'Basic agricultural safety',
                'requires_special_equipment' => false,
            ],
        ]);

        return $cargoTypes->map(function ($cargoTypeData) {
            return CargoType::firstOrCreate(
                ['name' => $cargoTypeData['name']],
                $cargoTypeData
            );
        });
    }

    private function createPerformances($operations, $driverTrucks, $places, $users, $cargoTypes)
    {
        $this->command->info('Creating performances...');

        $performances = collect([
            [
                'load_phase' => 'main',
                'load_completion' => 'full',
                'FOnumber' => 'FO001',
                'operation_id' => $operations->where('operationid', 'OP001')->first()->id,
                'driver_truck_id' => $driverTrucks->first()->id,
                'DateDispach' => now()->subDays(5),
                'orgion_id' => $places->where('code', 'BOL-AIR')->first()->id,
                'destination_id' => $places->where('code', 'ADA')->first()->id,
                'DistanceWCargo' => 120.00,
                'tonkm' => 600.00,
                'DistanceWOCargo' => 120.00,
                'CargoVolumMT' => 5.00,
                'fuelInLitter' => 45.00,
                'fuelInBirr' => 2250.00,
                'perdiem' => 500.00,
                'workOnGoing' => 0.00,
                'other' => 200.00,
                'comment' => 'Smooth trip, no issues',
                'satus' => 'returned',
                'is_returned' => true,
                'returned_date' => now()->subDays(3),
                'user_id' => $users->first()->id,
                'cargo_type_id' => $cargoTypes->where('name', 'General Cargo')->first()->id,
                'cargo_weight_kg' => 5000.00,
                'cargo_volume_cubic_meters' => 15.00,
                'loading_method' => 'Manual',
                'unloading_method' => 'Manual',
                'loading_time_minutes' => 120,
                'unloading_time_minutes' => 90,
                'cargo_condition_notes' => 'Good condition',
            ],
            [
                'load_phase' => 'return',
                'load_completion' => 'partial',
                'FOnumber' => 'FO002',
                'operation_id' => $operations->where('operationid', 'OP002')->first()->id,
                'driver_truck_id' => $driverTrucks->skip(1)->first()->id,
                'DateDispach' => now()->subDays(3),
                'orgion_id' => $places->where('code', 'MER')->first()->id,
                'destination_id' => $places->where('code', 'AMB-TWN')->first()->id,
                'DistanceWCargo' => 80.00,
                'tonkm' => 240.00,
                'DistanceWOCargo' => 80.00,
                'CargoVolumMT' => 3.00,
                'fuelInLitter' => 30.00,
                'fuelInBirr' => 1500.00,
                'perdiem' => 300.00,
                'workOnGoing' => 0.00,
                'other' => 150.00,
                'comment' => 'Completed successfully',
                'satus' => 'returned',
                'is_returned' => true,
                'returned_date' => now()->subDay(),
                'user_id' => $users->first()->id,
                'cargo_type_id' => $cargoTypes->where('name', 'Food & Beverages')->first()->id,
                'cargo_weight_kg' => 3000.00,
                'cargo_volume_cubic_meters' => 12.00,
                'loading_method' => 'Forklift',
                'unloading_method' => 'Forklift',
                'loading_time_minutes' => 90,
                'unloading_time_minutes' => 60,
                'cargo_condition_notes' => 'Excellent condition',
            ],
            [
                'load_phase' => 'main',
                'load_completion' => 'partial',
                'FOnumber' => 'FO003',
                'operation_id' => $operations->where('operationid', 'OP004')->first()->id,
                'driver_truck_id' => $driverTrucks->skip(2)->first()->id,
                'DateDispach' => now()->subDays(1),
                'orgion_id' => $places->where('code', 'ADA')->first()->id,
                'destination_id' => $places->where('code', 'BHD')->first()->id,
                'DistanceWCargo' => 150.00,
                'tonkm' => 1200.00,
                'DistanceWOCargo' => 150.00,
                'CargoVolumMT' => 8.00,
                'fuelInLitter' => 60.00,
                'fuelInBirr' => 3000.00,
                'perdiem' => 800.00,
                'workOnGoing' => 0.00,
                'other' => 400.00,
                'comment' => 'In progress',
                'satus' => 'in_progress',
                'is_returned' => false,
                'user_id' => $users->first()->id,
                'cargo_type_id' => $cargoTypes->where('name', 'Fuel & Chemicals')->first()->id,
                'cargo_weight_kg' => 8000.00,
                'cargo_volume_cubic_meters' => 25.00,
                'loading_method' => 'Pump',
                'unloading_method' => 'Pump',
                'loading_time_minutes' => 180,
                'unloading_time_minutes' => 150,
                'cargo_condition_notes' => 'Secure transport',
            ],
            [
                'load_phase' => 'return',
                'load_completion' => 'full',
                'FOnumber' => 'FO004',
                'operation_id' => $operations->where('operationid', 'OP001')->first()->id,
                'driver_truck_id' => $driverTrucks->skip(3)->first()->id,
                'DateDispach' => now()->subDays(10),
                'orgion_id' => $places->where('code', 'PIA')->first()->id,
                'destination_id' => $places->where('code', 'DBB-TWN')->first()->id,
                'DistanceWCargo' => 100.00,
                'tonkm' => 400.00,
                'DistanceWOCargo' => 100.00,
                'CargoVolumMT' => 4.00,
                'fuelInLitter' => 40.00,
                'fuelInBirr' => 2000.00,
                'perdiem' => 400.00,
                'workOnGoing' => 0.00,
                'other' => 250.00,
                'comment' => 'Completed on time',
                'satus' => 'returned',
                'is_returned' => true,
                'returned_date' => now()->subDays(8),
                'user_id' => $users->first()->id,
                'cargo_type_id' => $cargoTypes->where('name', 'Construction Materials')->first()->id,
                'cargo_weight_kg' => 4000.00,
                'cargo_volume_cubic_meters' => 18.00,
                'loading_method' => 'Crane',
                'unloading_method' => 'Crane',
                'loading_time_minutes' => 150,
                'unloading_time_minutes' => 120,
                'cargo_condition_notes' => 'No damage',
            ],
        ]);

        return $performances->map(function ($performanceData) {
            return Performance::firstOrCreate(
                ['FOnumber' => $performanceData['FOnumber']],
                $performanceData
            );
        });
    }

    private function createMaintenanceData($trucks, $users)
    {
        $this->command->info('Creating maintenance data...');

        // Create maintenance types
        $maintenanceTypes = collect([
            [
                'name' => 'Regular Service',
                'category' => 'Preventive',
                'interval_km' => 10000,
                'interval_months' => 6,
                'estimated_cost' => 15000.00,
                'description' => 'Regular maintenance service',
                'is_active' => true,
            ],
            [
                'name' => 'Engine Repair',
                'category' => 'Corrective',
                'interval_km' => null,
                'interval_months' => null,
                'estimated_cost' => 50000.00,
                'description' => 'Engine repair and maintenance',
                'is_active' => true,
            ],
            [
                'name' => 'Brake Service',
                'category' => 'Preventive',
                'interval_km' => 20000,
                'interval_months' => 12,
                'estimated_cost' => 25000.00,
                'description' => 'Brake system maintenance',
                'is_active' => true,
            ],
            [
                'name' => 'Tire Replacement',
                'category' => 'Preventive',
                'interval_km' => 80000,
                'interval_months' => 24,
                'estimated_cost' => 80000.00,
                'description' => 'Tire replacement service',
                'is_active' => true,
            ],
            [
                'name' => 'Electrical Repair',
                'category' => 'Corrective',
                'interval_km' => null,
                'interval_months' => null,
                'estimated_cost' => 15000.00,
                'description' => 'Electrical system repair',
                'is_active' => true,
            ],
        ]);

        $maintenanceTypes->each(function ($typeData) {
            MaintenanceType::firstOrCreate(
                ['name' => $typeData['name']],
                $typeData
            );
        });

        // Create maintenance records
        $maintenanceRecords = collect([
            [
                'truck_id' => $trucks->first()->id,
                'maintenance_type_id' => MaintenanceType::where('name', 'Regular Service')->first()->id,
                'user_id' => $users->first()->id,
                'scheduled_date' => now()->subDays(30),
                'completed_date' => now()->subDays(30),
                'odometer_reading' => 45000,
                'cost' => 15000.00,
                'description' => 'Regular 10,000 km service',
                'work_performed' => 'Oil change, filter replacement, inspection',
                'parts_replaced' => 'Engine oil, oil filter, air filter',
                'service_provider' => 'Auto Service Center',
                'status' => 'completed',
                'assigned_mechanic_id' => $users->first()->id,
            ],
            [
                'truck_id' => $trucks->skip(1)->first()->id,
                'maintenance_type_id' => MaintenanceType::where('name', 'Brake Service')->first()->id,
                'user_id' => $users->first()->id,
                'scheduled_date' => now()->subDays(15),
                'completed_date' => now()->subDays(15),
                'odometer_reading' => 32000,
                'cost' => 8500.00,
                'description' => 'Brake pad replacement',
                'work_performed' => 'Brake pad replacement, brake fluid check',
                'parts_replaced' => 'Front brake pads, brake fluid',
                'service_provider' => 'Brake Specialist',
                'status' => 'completed',
                'assigned_mechanic_id' => $users->first()->id,
            ],
        ]);

        $maintenanceRecords->each(function ($recordData) {
            VehicleMaintenanceRecord::firstOrCreate(
                [
                    'truck_id' => $recordData['truck_id'],
                    'scheduled_date' => $recordData['scheduled_date'],
                ],
                $recordData
            );
        });
    }

    private function createFuelRecords($trucks, $drivers, $users)
    {
        $this->command->info('Creating fuel records...');

        $fuelRecords = collect([
            [
                'truck_id' => $trucks->first()->id,
                'driver_id' => $drivers->first()->id,
                'user_id' => $users->first()->id,
                'fuel_date' => now()->subDays(5),
                'fuel_quantity_liters' => 200.00,
                'fuel_price_per_liter' => 50.00,
                'total_cost' => 10000.00,
                'fuel_station' => 'Total Ethiopia',
                'fuel_type' => 'diesel',
                'receipt_number' => 'RCP001',
                'odometer_reading' => 45000,
                'notes' => 'Full tank refill',
            ],
            [
                'truck_id' => $trucks->skip(1)->first()->id,
                'driver_id' => $drivers->skip(1)->first()->id,
                'user_id' => $users->first()->id,
                'fuel_date' => now()->subDays(3),
                'fuel_quantity_liters' => 150.00,
                'fuel_price_per_liter' => 50.00,
                'total_cost' => 7500.00,
                'fuel_station' => 'Shell Ethiopia',
                'fuel_type' => 'diesel',
                'receipt_number' => 'RCP002',
                'odometer_reading' => 32000,
                'notes' => 'Mid-trip refuel',
            ],
        ]);

        $fuelRecords->each(function ($recordData) {
            FuelRecord::firstOrCreate(
                [
                    'truck_id' => $recordData['truck_id'],
                    'fuel_date' => $recordData['fuel_date'],
                    'receipt_number' => $recordData['receipt_number'],
                ],
                $recordData
            );
        });
    }

    private function createDriverPerformanceRecords($drivers, $users)
    {
        $this->command->info('Creating driver performance records...');

        $performanceRecords = collect([
            [
                'driver_id' => $drivers->first()->id,
                'user_id' => $users->first()->id,
                'record_date' => now()->subDays(30),
                'trips_completed' => 12,
                'total_distance_km' => 1440.00,
                'total_tonnage_mt' => 60.00,
                'fuel_efficiency_liters_per_100km' => 35.00,
                'safety_score' => 95.00,
                'customer_satisfaction_score' => 92.00,
                'on_time_delivery_rate' => 98.00,
                'notes' => 'Excellent performance this month',
            ],
            [
                'driver_id' => $drivers->skip(1)->first()->id,
                'user_id' => $users->first()->id,
                'record_date' => now()->subDays(30),
                'trips_completed' => 8,
                'total_distance_km' => 640.00,
                'total_tonnage_mt' => 24.00,
                'fuel_efficiency_liters_per_100km' => 32.00,
                'safety_score' => 88.00,
                'customer_satisfaction_score' => 90.00,
                'on_time_delivery_rate' => 95.00,
                'notes' => 'Good performance, room for improvement',
            ],
        ]);

        $performanceRecords->each(function ($recordData) {
            DriverPerformanceRecord::firstOrCreate(
                [
                    'driver_id' => $recordData['driver_id'],
                    'record_date' => $recordData['record_date'],
                ],
                $recordData
            );
        });
    }

    private function createDriverSafetyRecords($drivers, $users)
    {
        $this->command->info('Creating driver safety records...');

        $safetyRecords = collect([
            [
                'driver_id' => $drivers->first()->id,
                'user_id' => $users->first()->id,
                'incident_date' => now()->subDays(60),
                'incident_type' => 'Minor Accident',
                'description' => 'Minor fender bender in parking lot',
                'severity' => 'Low',
                'damage_cost' => 5000.00,
                'injuries' => 'None',
                'location' => 'Addis Ababa',
                'weather_conditions' => 'Clear',
                'road_conditions' => 'Good',
                'resolution' => 'Insurance claim processed',
                'preventive_measures' => 'Additional parking training',
            ],
            [
                'driver_id' => $drivers->skip(2)->first()->id,
                'user_id' => $users->first()->id,
                'incident_date' => now()->subDays(90),
                'incident_type' => 'Traffic Violation',
                'description' => 'Speeding violation on highway',
                'severity' => 'Low',
                'damage_cost' => 0.00,
                'injuries' => 'None',
                'location' => 'Adama Highway',
                'weather_conditions' => 'Clear',
                'road_conditions' => 'Good',
                'resolution' => 'Fine paid, driver counseling',
                'preventive_measures' => 'Speed monitoring system installed',
            ],
        ]);

        $safetyRecords->each(function ($recordData) {
            DriverSafetyRecord::firstOrCreate(
                [
                    'driver_id' => $recordData['driver_id'],
                    'incident_date' => $recordData['incident_date'],
                    'incident_type' => $recordData['incident_type'],
                ],
                $recordData
            );
        });
    }

    private function createFinancialRecords($trucks, $users)
    {
        $this->command->info('Creating financial records...');

        $financialRecords = collect([
            [
                'truck_id' => $trucks->first()->id,
                'user_id' => $users->first()->id,
                'record_date' => now()->subDays(30),
                'revenue' => 150000.00,
                'fuel_cost' => 25000.00,
                'maintenance_cost' => 15000.00,
                'driver_cost' => 8000.00,
                'insurance_cost' => 5000.00,
                'depreciation' => 12500.00,
                'other_costs' => 3000.00,
                'total_costs' => 65500.00,
                'net_profit' => 84500.00,
                'profit_margin_percentage' => 56.33,
                'notes' => 'Good month for this truck',
            ],
            [
                'truck_id' => $trucks->skip(1)->first()->id,
                'user_id' => $users->first()->id,
                'record_date' => now()->subDays(30),
                'revenue' => 120000.00,
                'fuel_cost' => 20000.00,
                'maintenance_cost' => 12000.00,
                'driver_cost' => 7000.00,
                'insurance_cost' => 4000.00,
                'depreciation' => 10000.00,
                'other_costs' => 2500.00,
                'total_costs' => 55500.00,
                'net_profit' => 64500.00,
                'profit_margin_percentage' => 53.75,
                'notes' => 'Steady performance',
            ],
        ]);

        $financialRecords->each(function ($recordData) {
            TruckFinancialRecord::firstOrCreate(
                [
                    'truck_id' => $recordData['truck_id'],
                    'record_date' => $recordData['record_date'],
                ],
                $recordData
            );
        });
    }

    private function createInsuranceRecords($trucks, $users)
    {
        $this->command->info('Creating insurance records...');

        $insuranceRecords = collect([
            [
                'truck_id' => $trucks->first()->id,
                'user_id' => $users->first()->id,
                'policy_number' => 'POL001',
                'insurance_company' => 'Nyala Insurance',
                'policy_type' => 'Comprehensive',
                'coverage_amount' => 3000000.00,
                'premium_amount' => 150000.00,
                'start_date' => now()->subMonths(6),
                'end_date' => now()->addMonths(6),
                'status' => 'Active',
                'notes' => 'Full coverage policy',
            ],
            [
                'truck_id' => $trucks->skip(1)->first()->id,
                'user_id' => $users->first()->id,
                'policy_number' => 'POL002',
                'insurance_company' => 'United Insurance',
                'policy_type' => 'Third Party',
                'coverage_amount' => 1000000.00,
                'premium_amount' => 75000.00,
                'start_date' => now()->subMonths(3),
                'end_date' => now()->addMonths(9),
                'status' => 'Active',
                'notes' => 'Basic coverage policy',
            ],
        ]);

        $insuranceRecords->each(function ($recordData) {
            InsuranceRecord::firstOrCreate(
                [
                    'truck_id' => $recordData['truck_id'],
                    'policy_number' => $recordData['policy_number'],
                ],
                $recordData
            );
        });
    }

    private function createRoutePlans($trucks, $places, $users)
    {
        $this->command->info('Creating route plans...');

        $routePlans = collect([
            [
                'truck_id' => $trucks->first()->id,
                'user_id' => $users->first()->id,
                'route_name' => 'Addis Ababa to Adama',
                'origin_place_id' => $places->where('code', 'BOL-AIR')->first()->id,
                'destination_place_id' => $places->where('code', 'ADA')->first()->id,
                'planned_departure_time' => now()->addDays(1)->setTime(8, 0),
                'estimated_arrival_time' => now()->addDays(1)->setTime(12, 0),
                'estimated_distance_km' => 120.00,
                'estimated_duration_hours' => 4.00,
                'planned_stops' => json_encode(['Rest stop at 60km']),
                'road_conditions' => 'Good',
                'weather_forecast' => 'Clear',
                'traffic_conditions' => 'Moderate',
                'fuel_stops' => json_encode(['Shell at 60km']),
                'notes' => 'Regular route, well maintained',
                'status' => 'Planned',
            ],
            [
                'truck_id' => $trucks->skip(1)->first()->id,
                'user_id' => $users->first()->id,
                'route_name' => 'Addis Ababa to Bahir Dar',
                'origin_place_id' => $places->where('code', 'MER')->first()->id,
                'destination_place_id' => $places->where('code', 'BHD')->first()->id,
                'planned_departure_time' => now()->addDays(2)->setTime(6, 0),
                'estimated_arrival_time' => now()->addDays(2)->setTime(18, 0),
                'estimated_distance_km' => 300.00,
                'estimated_duration_hours' => 12.00,
                'planned_stops' => json_encode(['Lunch at Debre Markos', 'Fuel at Bahir Dar']),
                'road_conditions' => 'Good',
                'weather_forecast' => 'Partly cloudy',
                'traffic_conditions' => 'Light',
                'fuel_stops' => json_encode(['Total at Debre Markos', 'Shell at Bahir Dar']),
                'notes' => 'Long distance route, plan for overnight stay',
                'status' => 'Planned',
            ],
        ]);

        $routePlans->each(function ($planData) {
            RoutePlan::firstOrCreate(
                [
                    'truck_id' => $planData['truck_id'],
                    'route_name' => $planData['route_name'],
                    'planned_departure_time' => $planData['planned_departure_time'],
                ],
                $planData
            );
        });
    }
}
