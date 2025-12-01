<?php

namespace App\Providers;

use App\Events\DriverCreated;
use App\Events\DriverDeleted;
use App\Events\DriverUpdated;
use App\Events\TruckCreated;
use App\Events\TruckDeleted;
use App\Events\TruckUpdated;
use App\Listeners\SendDriverLifecycleNotification;
use App\Listeners\SendTruckLifecycleNotification;
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
    }
}
