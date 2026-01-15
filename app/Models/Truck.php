<?php

namespace App\Models;

use App\Traits\ClearsCacheOnModelEvents;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Truck extends Model
{
    use ClearsCacheOnModelEvents, HasFactory, LogsActivity, SoftDeletes;

    protected $fillable = [
        'plate',
        'vehicletype_id',
        'chasisNumber',
        'engineNumber',
        'tyreSyze',
        'serviceIntervalKM',
        'purchasePrice',
        'productionDate',
        'serviceStartDate',
        'status',
    ];

    protected $casts = [
        'productionDate' => 'date',
        'serviceStartDate' => 'date',
        'purchasePrice' => 'decimal:2',
    ];

    /**
     * Get the vehicle type that owns the truck.
     */
    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class, 'vehicletype_id');
    }

    /**
     * The drivers that belong to the truck.
     */
    public function drivers(): BelongsToMany
    {
        return $this->belongsToMany(Driver::class, 'driver_truck')
            ->withPivot(['assigned_date', 'unassigned_date', 'status'])
            ->withTimestamps();
    }

    /**
     * Get the driver truck assignments for the truck.
     */
    public function driverTrucks(): HasMany
    {
        return $this->hasMany(DriverTruck::class);
    }

    /**
     * Get the performances for the truck through driver truck assignments.
     */
    public function performances(): HasManyThrough
    {
        return $this->hasManyThrough(Performance::class, DriverTruck::class, 'truck_id', 'driver_truck_id');
    }

    /**
     * Get the maintenance records for the truck.
     */
    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(VehicleMaintenanceRecord::class);
    }

    /**
     * Get the fuel records for the truck.
     */
    public function fuelRecords(): HasMany
    {
        return $this->hasMany(FuelRecord::class);
    }

    /**
     * Get the fuel consumption analysis for the truck.
     */
    public function fuelConsumptionAnalysis(): HasMany
    {
        return $this->hasMany(FuelConsumptionAnalysis::class);
    }

    /**
     * Get the financial records for the truck.
     */
    public function financialRecords(): HasMany
    {
        return $this->hasMany(TruckFinancialRecord::class);
    }

    /**
     * Get the insurance records for the truck.
     */
    public function insuranceRecords(): HasMany
    {
        return $this->hasMany(InsuranceRecord::class);
    }

    /**
     * Get the route plans for the truck.
     */
    public function routePlans(): HasMany
    {
        return $this->hasMany(RoutePlan::class);
    }

    /**
     * Get the daily statuses for the truck.
     */
    public function dailyStatuses(): HasMany
    {
        return $this->hasMany(DailyTruckStatus::class);
    }

    /**
     * Scope a query to only include active trucks.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['plate', 'vehicletype_id', 'chasisNumber', 'engineNumber', 'tyreSyze', 'serviceIntervalKM', 'purchasePrice', 'productionDate', 'serviceStartDate', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('trucks');
    }
}
