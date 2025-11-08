<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Distance extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'from_place_id',
        'to_place_id',
        'distance_km',
        'status',
        'estimated_time_hours',
        'route_description',
        'route_type',
        'estimated_travel_time_minutes',
        'road_condition_factor',
        'toll_road',
        'toll_cost',
        'restricted_for_heavy_vehicles',
        'route_notes',
        'average_speed_kmph',
        'typical_delay_minutes',
        'road_quality_index',
        'seasonality_notes',
        'safety_notes',
    ];

    protected $casts = [
        'distance_km' => 'decimal:2',
        'estimated_time_hours' => 'decimal:2',
        'road_condition_factor' => 'decimal:2',
        'toll_cost' => 'decimal:2',
        'toll_road' => 'boolean',
        'restricted_for_heavy_vehicles' => 'boolean',
        'status' => 'string',
        'average_speed_kmph' => 'decimal:2',
        'road_quality_index' => 'decimal:2',
        'typical_delay_minutes' => 'integer',
    ];

    /**
     * Get the from place that owns the distance.
     */
    public function fromPlace(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'from_place_id');
    }

    /**
     * Get the to place that owns the distance.
     */
    public function toPlace(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'to_place_id');
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    public function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);

        $c = 2 * atan2(sqrt($a), sqrt(1-$a));

        return $earthRadius * $c;
    }

    /**
     * Get average speed based on route type
     */
    public function getAverageSpeed(): float
    {
        return match($this->route_type) {
            'primary' => 80.0,
            'secondary' => 50.0,
            'alternative' => 40.0,
            default => 50.0
        };
    }

    /**
     * Calculate estimated time based on distance and route conditions
     */
    public function calculateEstimatedTime(): float
    {
        if ($this->distance_km <= 0) return 0;

        $baseTime = $this->distance_km / $this->getAverageSpeed();
        return $baseTime * $this->road_condition_factor;
    }

    /**
     * Check if route is suitable for heavy vehicles
     */
    public function isSuitableForHeavyVehicles(): bool
    {
        return !$this->restricted_for_heavy_vehicles;
    }

    /**
     * Get total cost including tolls
     */
    public function getTotalCost(): float
    {
        return $this->toll_road ? $this->toll_cost : 0;
    }

    /**
     * Scope to get only active distances.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter by route type.
     */
    public function scopeByRouteType($query, $routeType)
    {
        return $query->where('route_type', $routeType);
    }

    /**
     * Scope to filter distances between places.
     */
    public function scopeBetweenPlaces($query, $fromPlaceId, $toPlaceId)
    {
        return $query->where(function ($q) use ($fromPlaceId, $toPlaceId) {
            $q->where('from_place_id', $fromPlaceId)
                ->where('to_place_id', $toPlaceId);
        })->orWhere(function ($q) use ($fromPlaceId, $toPlaceId) {
            $q->where('from_place_id', $toPlaceId)
                ->where('to_place_id', $fromPlaceId);
        });
    }

    /**
     * Scope to filter by distance range.
     */
    public function scopeByDistanceRange($query, $minDistance, $maxDistance)
    {
        return $query->whereBetween('distance_km', [$minDistance, $maxDistance]);
    }

    /**
     * Scope to get toll roads.
     */
    public function scopeWithTolls($query)
    {
        return $query->where('toll_road', true);
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'from_place_id',
                'to_place_id',
                'distance_km',
                'status',
                'estimated_time_hours',
                'route_description',
                'route_type',
                'estimated_travel_time_minutes',
                'road_condition_factor',
                'toll_road',
                'toll_cost',
                'restricted_for_heavy_vehicles',
                'route_notes',
                'average_speed_kmph',
                'typical_delay_minutes',
                'road_quality_index',
                'seasonality_notes',
                'safety_notes'
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('distances');
    }
}



