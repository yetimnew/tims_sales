<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Driver extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
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
            ->logOnly(['driverid', 'name', 'sex', 'birthdate', 'zone', 'woreda', 'kebele', 'housenumber', 'mobile', 'hireddate', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('drivers');
    }
}
