<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Performance extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'trip',
        'LoadType',
        'FOnumber',
        'operation_id',
        'driver_truck_id',
        'DateDispach',
        'orgion_id',
        'destination_id',
        'DistanceWCargo',
        'tonkm',
        'DistanceWOCargo',
        'CargoVolumMT',
        'fuelInLitter',
        'fuelInBirr',
        'perdiem',
        'workOnGoing',
        'other',
        'comment',
        'satus',
        'is_returned',
        'returned_date',
        'user_id',
        'cargo_type_id',
        'cargo_weight_kg',
        'cargo_volume_cubic_meters',
        'loading_method',
        'unloading_method',
        'loading_time_minutes',
        'unloading_time_minutes',
        'cargo_condition_notes',
    ];

    protected $casts = [
        'DateDispach' => 'date',
        'returned_date' => 'date',
        'DistanceWCargo' => 'decimal:2',
        'tonkm' => 'decimal:2',
        'DistanceWOCargo' => 'decimal:2',
        'CargoVolumMT' => 'decimal:2',
        'fuelInLitter' => 'decimal:2',
        'fuelInBirr' => 'decimal:2',
        'perdiem' => 'decimal:2',
        'workOnGoing' => 'decimal:2',
        'other' => 'decimal:2',
        'is_returned' => 'boolean',
        'cargo_weight_kg' => 'decimal:2',
        'cargo_volume_cubic_meters' => 'decimal:2',
    ];

    /**
     * Get the operation that owns the performance.
     */
    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }

    /**
     * Get the user that owns the performance.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the origin place that owns the performance.
     */
    public function origin(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'orgion_id');
    }

    /**
     * Get the destination place that owns the performance.
     */
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'destination_id');
    }

    /**
     * Get the driver-truck assignment that owns the performance.
     */
    public function driverTruck(): BelongsTo
    {
        return $this->belongsTo(DriverTruck::class);
    }

    /**
     * Get the cargo type that owns the performance.
     */
    public function cargoType(): BelongsTo
    {
        return $this->belongsTo(CargoType::class);
    }

    /**
     * Scope a query to only include returned performances.
     */
    public function scopeReturned($query)
    {
        return $query->where('is_returned', true);
    }

    /**
     * Scope a query to only include not returned performances.
     */
    public function scopeNotReturned($query)
    {
        return $query->where('is_returned', false);
    }

    /**
     * Scope a query to only include active performances.
     */
    public function scopeActive($query)
    {
        return $query->where('satus', 'active');
    }

    /**
     * Scope a query to only include open performances.
     */
    public function scopeOpen($query)
    {
        return $query->where('satus', 'open');
    }

    /**
     * Scope a query to only include main trip performances.
     */
    public function scopeMainTrip($query)
    {
        return $query->where('LoadType', 'main');
    }

    /**
     * Scope a query to only include main trip returned performances.
     */
    public function scopeMainTripReturned($query)
    {
        return $query->where('LoadType', 'main')->where('is_returned', true);
    }

    /**
     * Scope a query to only include main trip not returned performances.
     */
    public function scopeMainTripNotReturned($query)
    {
        return $query->where('LoadType', 'main')->where('is_returned', false);
    }

    /**
     * Get the date difference attribute.
     */
    public function getDateDifferenceAttribute()
    {
        if ($this->returned_date) {
            return $this->DateDispach->diffInDays($this->returned_date);
        }

        return $this->DateDispach->diffInDays(now());
    }

    /**
     * Get the total km attribute.
     */
    public function getTotalKmAttribute()
    {
        return ($this->DistanceWCargo ?? 0) + ($this->DistanceWOCargo ?? 0);
    }

    /**
     * Get the date dispatch attribute.
     */
    public function getDateDispatchAttribute()
    {
        return $this->DateDispach;
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['trip', 'LoadType', 'FOnumber', 'operation_id', 'driver_truck_id', 'DateDispach', 'orgion_id', 'destination_id', 'DistanceWCargo', 'tonkm', 'DistanceWOCargo', 'CargoVolumMT', 'fuelInLitter', 'fuelInBirr', 'perdiem', 'workOnGoing', 'other', 'comment', 'satus', 'is_returned', 'cargo_type_id', 'cargo_weight_kg', 'cargo_volume_cubic_meters'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('performances');
    }
}
