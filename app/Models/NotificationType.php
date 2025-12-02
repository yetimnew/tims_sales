<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotificationType extends Model
{
    use HasFactory;

    public const TRUCK_CREATED = 'truck.created';

    public const TRUCK_UPDATED = 'truck.updated';

    public const TRUCK_DELETED = 'truck.deleted';

    public const USER_CREATED = 'user.created';

    public const USER_UPDATED = 'user.updated';

    public const USER_DELETED = 'user.deleted';

    public const DRIVER_CREATED = 'driver.created';

    public const DRIVER_UPDATED = 'driver.updated';

    public const DRIVER_DELETED = 'driver.deleted';

    public const DRIVER_TRUCK_CREATED = 'driver_truck.created';

    public const DRIVER_TRUCK_UPDATED = 'driver_truck.updated';

    public const DRIVER_TRUCK_DELETED = 'driver_truck.deleted';

    public const VEHICLE_TYPE_CREATED = 'vehicle_type.created';

    public const VEHICLE_TYPE_UPDATED = 'vehicle_type.updated';

    public const VEHICLE_TYPE_DELETED = 'vehicle_type.deleted';

    public const FUEL_RECORD_CREATED = 'fuel_record.created';

    public const FUEL_RECORD_UPDATED = 'fuel_record.updated';

    public const FUEL_RECORD_DELETED = 'fuel_record.deleted';

    public const DRIVER_SAFETY_CREATED = 'driver_safety.created';

    public const DRIVER_SAFETY_UPDATED = 'driver_safety.updated';

    public const DRIVER_SAFETY_DELETED = 'driver_safety.deleted';

    public const CARGO_TYPE_CREATED = 'cargo_type.created';

    public const CARGO_TYPE_UPDATED = 'cargo_type.updated';

    public const CARGO_TYPE_DELETED = 'cargo_type.deleted';

    public const REGION_CREATED = 'region.created';

    public const REGION_UPDATED = 'region.updated';

    public const REGION_DELETED = 'region.deleted';

    public const ZONE_CREATED = 'zone.created';

    public const ZONE_UPDATED = 'zone.updated';

    public const ZONE_DELETED = 'zone.deleted';

    public const WOREDA_CREATED = 'woreda.created';

    public const WOREDA_UPDATED = 'woreda.updated';

    public const WOREDA_DELETED = 'woreda.deleted';

    public const PLACE_CREATED = 'place.created';

    public const PLACE_UPDATED = 'place.updated';

    public const PLACE_DELETED = 'place.deleted';

    public const DISTANCE_CREATED = 'distance.created';

    public const DISTANCE_UPDATED = 'distance.updated';

    public const DISTANCE_DELETED = 'distance.deleted';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'key',
        'name',
        'description',
        'default_in_app',
        'default_email',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'default_in_app' => 'boolean',
        'default_email' => 'boolean',
    ];

    public function userSettings(): HasMany
    {
        return $this->hasMany(UserNotificationSetting::class);
    }
}
