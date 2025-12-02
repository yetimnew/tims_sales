<?php

namespace App\Providers;

use App\Events\CargoTypeCreated;
use App\Events\CargoTypeDeleted;
use App\Events\CargoTypeUpdated;
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
use App\Events\TruckCreated;
use App\Events\TruckDeleted;
use App\Events\TruckUpdated;
use App\Events\VehicleTypeCreated;
use App\Events\VehicleTypeDeleted;
use App\Events\VehicleTypeUpdated;
use App\Listeners\SendCargoTypeLifecycleNotification;
use App\Listeners\SendDriverLifecycleNotification;
use App\Listeners\SendDriverSafetyLifecycleNotification;
use App\Listeners\SendDriverTruckLifecycleNotification;
use App\Listeners\SendFuelRecordLifecycleNotification;
use App\Listeners\SendTruckLifecycleNotification;
use App\Listeners\SendVehicleTypeLifecycleNotification;
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
    }
}
