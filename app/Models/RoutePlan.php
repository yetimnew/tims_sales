<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class RoutePlan extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'operation_id',
        'truck_id',
        'driver_id',
        'planned_date',
        'planned_departure_time',
        'planned_arrival_time',
        'route_waypoints',
        'total_distance_km',
        'total_travel_time_minutes',
        'estimated_fuel_cost',
        'status',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'planned_date' => 'date',
        'planned_departure_time' => 'datetime:H:i',
        'planned_arrival_time' => 'datetime:H:i',
        'route_waypoints' => 'array',
        'total_distance_km' => 'decimal:2',
        'estimated_fuel_cost' => 'decimal:2',
    ];

    /**
     * Get the operation that owns the route plan.
     */
    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }

    /**
     * Get the truck that owns the route plan.
     */
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    /**
     * Get the driver that owns the route plan.
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * Get the user that owns the route plan.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include planned route plans.
     */
    public function scopePlanned($query)
    {
        return $query->where('status', 'planned');
    }

    /**
     * Scope a query to only include in progress route plans.
     */
    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    /**
     * Scope a query to only include completed route plans.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope a query to only include cancelled route plans.
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Scope a query to filter by planned date.
     */
    public function scopePlannedDate($query, $date)
    {
        return $query->where('planned_date', $date);
    }

    /**
     * Scope a query to filter by truck.
     */
    public function scopeForTruck($query, $truckId)
    {
        return $query->where('truck_id', $truckId);
    }

    /**
     * Scope a query to filter by driver.
     */
    public function scopeForDriver($query, $driverId)
    {
        return $query->where('driver_id', $driverId);
    }

    /**
     * Get the estimated arrival time.
     */
    public function getEstimatedArrivalTimeAttribute()
    {
        if ($this->planned_departure_time && $this->total_travel_time_minutes) {
            return $this->planned_departure_time->addMinutes($this->total_travel_time_minutes);
        }
        return $this->planned_arrival_time;
    }

    /**
     * Get the route efficiency score.
     */
    public function getRouteEfficiencyScoreAttribute()
    {
        // This would calculate based on distance, time, and fuel cost
        if ($this->total_distance_km > 0 && $this->total_travel_time_minutes > 0) {
            $speed = ($this->total_distance_km / $this->total_travel_time_minutes) * 60; // km/h
            return min(100, $speed * 2); // Simple scoring based on speed
        }
        return 0;
    }

    /**
     * Get the fuel efficiency estimate.
     */
    public function getFuelEfficiencyEstimateAttribute()
    {
        if ($this->total_distance_km > 0 && $this->estimated_fuel_cost > 0) {
            // Assuming average fuel price of $1.5 per liter
            $estimatedFuelLiters = $this->estimated_fuel_cost / 1.5;
            return $this->total_distance_km / $estimatedFuelLiters;
        }
        return 0;
    }

    /**
     * Check if route plan is overdue.
     */
    public function getIsOverdueAttribute()
    {
        return $this->status === 'in_progress' &&
               $this->planned_arrival_time < now();
    }

    /**
     * Get the waypoints as place models.
     */
    public function getWaypointPlacesAttribute()
    {
        if ($this->route_waypoints && is_array($this->route_waypoints)) {
            return Place::whereIn('id', $this->route_waypoints)->get();
        }
        return collect();
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'operation_id',
                'truck_id',
                'driver_id',
                'planned_date',
                'planned_departure_time',
                'planned_arrival_time',
                'route_waypoints',
                'total_distance_km',
                'total_travel_time_minutes',
                'estimated_fuel_cost',
                'status',
                'notes'
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('route_plans');
    }
}



