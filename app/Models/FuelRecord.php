<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class FuelRecord extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'truck_id',
        'driver_id',
        'driver_truck_id',
        'fuel_date',
        'fuel_quantity_liters',
        'fuel_price_per_liter',
        'total_cost',
        'fuel_station',
        'fuel_type',
        'odometer_reading',
        'receipt_number',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'fuel_date' => 'date',
        'fuel_quantity_liters' => 'decimal:2',
        'fuel_price_per_liter' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    /**
     * Get the truck that owns the fuel record.
     */
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    /**
     * Get the driver that owns the fuel record.
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * Get the user that owns the fuel record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the driver/truck assignment associated with the fuel record.
     */
    public function driverTruck(): BelongsTo
    {
        return $this->belongsTo(DriverTruck::class);
    }

    /**
     * Scope a query to only include diesel fuel records.
     */
    public function scopeDiesel($query)
    {
        return $query->where('fuel_type', 'diesel');
    }

    /**
     * Scope a query to only include petrol fuel records.
     */
    public function scopePetrol($query)
    {
        return $query->where('fuel_type', 'petrol');
    }

    /**
     * Scope a query to only include gas fuel records.
     */
    public function scopeGas($query)
    {
        return $query->where('fuel_type', 'gas');
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('fuel_date', [$startDate, $endDate]);
    }

    /**
     * Scope a query to filter by truck.
     */
    public function scopeForTruck($query, $truckId)
    {
        return $query->where('truck_id', $truckId);
    }

    /**
     * Get the fuel efficiency for this record.
     */
    public function getFuelEfficiencyAttribute()
    {
        if ($this->odometer_reading && $this->fuel_quantity_liters > 0) {
            // This would need previous odometer reading to calculate actual efficiency
            return null;
        }
        return null;
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['truck_id', 'driver_id', 'fuel_date', 'fuel_quantity_liters', 'fuel_price_per_liter', 'total_cost', 'fuel_station', 'fuel_type', 'odometer_reading', 'receipt_number', 'notes'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('fuel_records');
    }
}



