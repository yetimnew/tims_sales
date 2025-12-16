# Automatic Cache Invalidation System

## Overview

This application implements an automatic cache invalidation system that ensures cached data is automatically cleared whenever the underlying database records are created, updated, or deleted. This eliminates the need for manual cache clearing in controllers and ensures data consistency across all pages.

## How It Works

### 1. CacheInvalidationService

The `App\Services\CacheInvalidationService` class maintains a mapping of model classes to their associated cache keys. When a model changes, all related cache keys are automatically cleared.

**Location:** `app/Services/CacheInvalidationService.php`

### 2. ClearsCacheOnModelEvents Trait

The `App\Traits\ClearsCacheOnModelEvents` trait automatically registers model event listeners (created, updated, deleted, restored) that trigger cache clearing.

**Location:** `app/Traits/ClearsCacheOnModelEvents.php`

### 3. Model Integration

All models that need cache invalidation use the `ClearsCacheOnModelEvents` trait:

```php
use App\Traits\ClearsCacheOnModelEvents;

class Truck extends Model
{
    use HasFactory, SoftDeletes, LogsActivity, ClearsCacheOnModelEvents;
}
```

### 4. Service Provider

The `CacheInvalidationServiceProvider` handles cache clearing for vendor models (like Spatie Permission's Role and Permission models) that cannot use the trait directly.

**Location:** `app/Providers/CacheInvalidationServiceProvider.php`

## Cache Key Mapping

The cache mapping is defined in `CacheInvalidationService::$cacheMap`. Each model class maps to an array of cache keys that should be cleared when that model changes.

### Example:

```php
\App\Models\Truck::class => [
    'trucks.status_options',
    'trucks.vehicle_types',
    'fuel_records.truck_options',
    'maintenance.create_trucks',
    'daily_truck_status.trucks',
    'reports.maintenance.truck_options',
    // ... more cache keys
],
```

## Adding New Cache Keys

### For Existing Models

If you add a new cache key for an existing model, simply add it to the `$cacheMap` array in `CacheInvalidationService`:

```php
\App\Models\Truck::class => [
    // ... existing keys
    'new_module.truck_options', // Add your new cache key here
],
```

### For New Models

1. Add the `ClearsCacheOnModelEvents` trait to your model:

```php
use App\Traits\ClearsCacheOnModelEvents;

class NewModel extends Model
{
    use HasFactory, ClearsCacheOnModelEvents;
}
```

2. Register cache keys in `CacheInvalidationService::$cacheMap`:

```php
\App\Models\NewModel::class => [
    'new_module.options',
    'new_module.metrics',
    // ... your cache keys
],
```

## Manual Cache Clearing

If you need to manually clear caches (e.g., in a controller or service), you can use:

```php
use App\Services\CacheInvalidationService;

// Clear all caches for a model instance
CacheInvalidationService::clearModelCaches($truck);

// Clear specific cache keys
CacheInvalidationService::clearCaches([
    'trucks.status_options',
    'trucks.vehicle_types',
]);
```

## Benefits

1. **Automatic**: No need to remember to clear caches in controllers
2. **Consistent**: All related caches are cleared together
3. **Maintainable**: Centralized cache key mapping
4. **Reliable**: Works for all CRUD operations (create, update, delete, restore)
5. **Performance**: Reduces database queries by caching frequently accessed data

## Models Currently Integrated

All major models have been integrated with automatic cache invalidation:

- ✅ Truck
- ✅ Driver
- ✅ DriverTruck
- ✅ VehicleType
- ✅ FuelRecord
- ✅ DriverSafetyRecord
- ✅ CargoType
- ✅ VehicleMaintenanceRecord
- ✅ MaintenanceType
- ✅ Operation
- ✅ Performance
- ✅ Customer
- ✅ Region
- ✅ Zone
- ✅ Woreda
- ✅ Place
- ✅ Distance
- ✅ StatusType
- ✅ Status
- ✅ DailyTruckStatus
- ✅ Outsource
- ✅ OutsourcePerformance
- ✅ User
- ✅ NotificationType
- ✅ Role (Spatie Permission)
- ✅ Permission (Spatie Permission)

## Testing

To verify cache invalidation is working:

1. Create a new record (e.g., a Truck)
2. Check that related cache keys are cleared
3. Access a page that uses those cache keys
4. Verify fresh data is loaded from the database

## Troubleshooting

### Cache not clearing?

1. Ensure the model uses `ClearsCacheOnModelEvents` trait
2. Verify cache keys are registered in `CacheInvalidationService::$cacheMap`
3. Check that model events are firing (use `dd()` in trait's boot method)
4. Verify cache driver is working (`php artisan cache:clear`)

### Performance issues?

- Cache TTLs are set appropriately (1 hour for static data, 5 minutes for metrics)
- Only necessary cache keys are cleared
- Consider using cache tags if your driver supports them

## Future Enhancements

- [ ] Add cache tags support for more granular clearing
- [ ] Add cache warming after invalidation
- [ ] Add monitoring/logging for cache operations
- [ ] Add admin interface to view/manage cache keys

