<?php

namespace App\Providers;

use App\Events\CargoTypeCreated;
use App\Events\CargoTypeDeleted;
use App\Events\CargoTypeUpdated;
use App\Events\DistanceCreated;
use App\Events\DistanceDeleted;
use App\Events\DistanceUpdated;
use App\Events\DriverCreated;
use App\Events\DriverDeleted;
use App\Events\DriverSafetyRecordCreated;
use App\Events\DriverSafetyRecordDeleted;
use App\Events\DriverSafetyRecordUpdated;
use App\Events\DriverTruckCreated;
use App\Events\DriverTruckDeleted;
use App\Events\DriverTruckUpdated;
use App\Events\DriverUpdated;
use App\Events\FuelRecordCreated;
use App\Events\FuelRecordDeleted;
use App\Events\FuelRecordUpdated;
use App\Events\OutsourceCreated;
use App\Events\OutsourceDeleted;
use App\Events\OutsourcePerformanceCreated;
use App\Events\OutsourcePerformanceDeleted;
use App\Events\OutsourcePerformanceUpdated;
use App\Events\OutsourceUpdated;
use App\Events\PlaceCreated;
use App\Events\PlaceDeleted;
use App\Events\PlaceUpdated;
use App\Events\RegionCreated;
use App\Events\RegionDeleted;
use App\Events\RegionUpdated;
use App\Events\TruckCreated;
use App\Events\TruckDeleted;
use App\Events\TruckUpdated;
use App\Events\VehicleTypeCreated;
use App\Events\VehicleTypeDeleted;
use App\Events\VehicleTypeUpdated;
use App\Events\WoredaCreated;
use App\Events\WoredaDeleted;
use App\Events\WoredaUpdated;
use App\Events\ZoneCreated;
use App\Events\ZoneDeleted;
use App\Events\ZoneUpdated;
use App\Listeners\SendCargoTypeLifecycleNotification;
use App\Listeners\SendDistanceLifecycleNotification;
use App\Listeners\SendDriverLifecycleNotification;
use App\Listeners\SendDriverSafetyLifecycleNotification;
use App\Listeners\SendDriverTruckLifecycleNotification;
use App\Listeners\SendFuelRecordLifecycleNotification;
use App\Listeners\SendOutsourceLifecycleNotification;
use App\Listeners\SendOutsourcePerformanceLifecycleNotification;
use App\Listeners\SendPlaceLifecycleNotification;
use App\Listeners\SendRegionLifecycleNotification;
use App\Listeners\SendTruckLifecycleNotification;
use App\Listeners\SendVehicleTypeLifecycleNotification;
use App\Listeners\SendWoredaLifecycleNotification;
use App\Listeners\SendZoneLifecycleNotification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register event listeners for truck lifecycle notifications
        Event::listen(TruckCreated::class, [SendTruckLifecycleNotification::class, 'handle']);
        Event::listen(TruckUpdated::class, [SendTruckLifecycleNotification::class, 'handle']);
        Event::listen(TruckDeleted::class, [SendTruckLifecycleNotification::class, 'handle']);

        // Register event listeners for driver lifecycle notifications
        Event::listen(DriverCreated::class, [SendDriverLifecycleNotification::class, 'handle']);
        Event::listen(DriverUpdated::class, [SendDriverLifecycleNotification::class, 'handle']);
        Event::listen(DriverDeleted::class, [SendDriverLifecycleNotification::class, 'handle']);

        // Driver-truck assignments
        Event::listen(DriverTruckCreated::class, [SendDriverTruckLifecycleNotification::class, 'handle']);
        Event::listen(DriverTruckUpdated::class, [SendDriverTruckLifecycleNotification::class, 'handle']);
        Event::listen(DriverTruckDeleted::class, [SendDriverTruckLifecycleNotification::class, 'handle']);

        // Vehicle types
        Event::listen(VehicleTypeCreated::class, [SendVehicleTypeLifecycleNotification::class, 'handle']);
        Event::listen(VehicleTypeUpdated::class, [SendVehicleTypeLifecycleNotification::class, 'handle']);
        Event::listen(VehicleTypeDeleted::class, [SendVehicleTypeLifecycleNotification::class, 'handle']);

        // Fuel records
        Event::listen(FuelRecordCreated::class, [SendFuelRecordLifecycleNotification::class, 'handle']);
        Event::listen(FuelRecordUpdated::class, [SendFuelRecordLifecycleNotification::class, 'handle']);
        Event::listen(FuelRecordDeleted::class, [SendFuelRecordLifecycleNotification::class, 'handle']);

        // Driver safety records
        Event::listen(DriverSafetyRecordCreated::class, [SendDriverSafetyLifecycleNotification::class, 'handle']);
        Event::listen(DriverSafetyRecordUpdated::class, [SendDriverSafetyLifecycleNotification::class, 'handle']);
        Event::listen(DriverSafetyRecordDeleted::class, [SendDriverSafetyLifecycleNotification::class, 'handle']);

        // Cargo types
        Event::listen(CargoTypeCreated::class, [SendCargoTypeLifecycleNotification::class, 'handle']);
        Event::listen(CargoTypeUpdated::class, [SendCargoTypeLifecycleNotification::class, 'handle']);
        Event::listen(CargoTypeDeleted::class, [SendCargoTypeLifecycleNotification::class, 'handle']);

        // Regions
        Event::listen(RegionCreated::class, [SendRegionLifecycleNotification::class, 'handle']);
        Event::listen(RegionUpdated::class, [SendRegionLifecycleNotification::class, 'handle']);
        Event::listen(RegionDeleted::class, [SendRegionLifecycleNotification::class, 'handle']);

        // Zones
        Event::listen(ZoneCreated::class, [SendZoneLifecycleNotification::class, 'handle']);
        Event::listen(ZoneUpdated::class, [SendZoneLifecycleNotification::class, 'handle']);
        Event::listen(ZoneDeleted::class, [SendZoneLifecycleNotification::class, 'handle']);

        // Woredas
        Event::listen(WoredaCreated::class, [SendWoredaLifecycleNotification::class, 'handle']);
        Event::listen(WoredaUpdated::class, [SendWoredaLifecycleNotification::class, 'handle']);
        Event::listen(WoredaDeleted::class, [SendWoredaLifecycleNotification::class, 'handle']);

        // Places
        Event::listen(PlaceCreated::class, [SendPlaceLifecycleNotification::class, 'handle']);
        Event::listen(PlaceUpdated::class, [SendPlaceLifecycleNotification::class, 'handle']);
        Event::listen(PlaceDeleted::class, [SendPlaceLifecycleNotification::class, 'handle']);

        // Distances
        Event::listen(DistanceCreated::class, [SendDistanceLifecycleNotification::class, 'handle']);
        Event::listen(DistanceUpdated::class, [SendDistanceLifecycleNotification::class, 'handle']);
        Event::listen(DistanceDeleted::class, [SendDistanceLifecycleNotification::class, 'handle']);

        // Outsources
        Event::listen(OutsourceCreated::class, [SendOutsourceLifecycleNotification::class, 'handle']);
        Event::listen(OutsourceUpdated::class, [SendOutsourceLifecycleNotification::class, 'handle']);
        Event::listen(OutsourceDeleted::class, [SendOutsourceLifecycleNotification::class, 'handle']);

        // Outsource performances
        Event::listen(OutsourcePerformanceCreated::class, [SendOutsourcePerformanceLifecycleNotification::class, 'handle']);
        Event::listen(OutsourcePerformanceUpdated::class, [SendOutsourcePerformanceLifecycleNotification::class, 'handle']);
        Event::listen(OutsourcePerformanceDeleted::class, [SendOutsourcePerformanceLifecycleNotification::class, 'handle']);
    }
}
