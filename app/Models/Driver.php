<?php

namespace App\Models;

use App\Traits\ClearsCacheOnModelEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Driver extends Model
{
    use HasFactory, SoftDeletes, LogsActivity, ClearsCacheOnModelEvents, HasApiTokens;

    protected $fillable = [
        'user_id',
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
        'password',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'hireddate' => 'date',
    ];

    /**
     * The trucks that belong to the driver.
     */
    public function trucks(): BelongsToMany
    {
        return $this->belongsToMany(Truck::class, 'driver_truck')
            ->withPivot(['assigned_date', 'unassigned_date', 'status'])
            ->withTimestamps();
    }

    /**
     * Get the driver truck assignments for the driver.
     */
    public function driverTrucks(): HasMany
    {
        return $this->hasMany(DriverTruck::class);
    }

    /**
     * Get the performances for the driver through driver truck assignments.
     */
    public function performances(): HasManyThrough
    {
        return $this->hasManyThrough(Performance::class, DriverTruck::class, 'driver_id', 'driver_truck_id');
    }

    /**
     * Get the performance records for the driver.
     */
    public function performanceRecords(): HasMany
    {
        return $this->hasMany(DriverPerformanceRecord::class);
    }

    /**
     * Get the safety records for the driver.
     */
    public function safetyRecords(): HasMany
    {
        return $this->hasMany(DriverSafetyRecord::class);
    }

    /**
     * Get the fuel records for the driver.
     */
    public function fuelRecords(): HasMany
    {
        return $this->hasMany(FuelRecord::class);
    }

    /**
     * Get the location records for the driver.
     */
    public function locations(): HasMany
    {
        return $this->hasMany(DriverLocation::class);
    }

    /**
     * Get the status history for the driver.
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(DriverStatusHistory::class);
    }

    /**
     * Get the user associated with this driver.
     * A driver can optionally be linked to a user (nullable relationship).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the active truck assignment for the driver.
     * An active assignment has:
     * - is_attached = 1 (true)
     * - status = 'active'
     * - date_detach IS NULL (not detached)
     * - deleted_at IS NULL (not soft deleted)
     */
    public function activeTruckAssignment()
    {
        return $this->hasOne(DriverTruck::class)
            ->where('is_attached', true)
            ->where('status', 'active')
            ->whereNull('date_detach')
            ->whereNull('deleted_at')
            ->latest('date_recived'); // Get the most recent assignment if multiple exist
    }

    /**
     * Set the driver's password.
     */
    public function setPasswordAttribute($value)
    {
        if ($value) {
            $this->attributes['password'] = Hash::make($value);
        }
    }

    /**
     * Scope a query to only include active drivers.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get the driver's sex attribute.
     */
    public function getSexAttribute($value)
    {
        return ucfirst($value);
    }

    /**
     * Get the driver's name attribute.
     */
    public function getNameAttribute($value)
    {
        return ucwords($value);
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['user_id', 'driverid', 'name', 'sex', 'birthdate', 'zone', 'woreda', 'kebele', 'housenumber', 'mobile', 'hireddate', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('drivers');
    }
}
