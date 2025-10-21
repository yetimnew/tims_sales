<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Truck extends Model
{
    use HasFactory, SoftDeletes;

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
        return $this->belongsTo(VehicleType::class);
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
     * Get the performances for the truck.
     */
    public function performances(): HasMany
    {
        return $this->hasMany(Performance::class, 'driver_truck_id');
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
     * Scope a query to only include active trucks.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
