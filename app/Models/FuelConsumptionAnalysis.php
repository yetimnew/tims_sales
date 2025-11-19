<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FuelConsumptionAnalysis extends Model
{
    use HasFactory;

    protected $table = 'fuel_consumption_analysis';

    protected $fillable = [
        'truck_id',
        'analysis_date',
        'total_distance_km',
        'total_fuel_consumed_liters',
        'fuel_efficiency_km_per_liter',
        'fuel_cost_per_km',
        'average_load_weight',
        'period_type',
    ];

    protected $casts = [
        'analysis_date' => 'date',
        'total_fuel_consumed_liters' => 'decimal:2',
        'fuel_efficiency_km_per_liter' => 'decimal:2',
        'fuel_cost_per_km' => 'decimal:2',
        'average_load_weight' => 'decimal:2',
    ];

    /**
     * Get the truck that owns the fuel consumption analysis.
     */
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    /**
     * Scope a query to only include daily analysis.
     */
    public function scopeDaily($query)
    {
        return $query->where('period_type', 'daily');
    }

    /**
     * Scope a query to only include weekly analysis.
     */
    public function scopeWeekly($query)
    {
        return $query->where('period_type', 'weekly');
    }

    /**
     * Scope a query to only include monthly analysis.
     */
    public function scopeMonthly($query)
    {
        return $query->where('period_type', 'monthly');
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('analysis_date', [$startDate, $endDate]);
    }

    /**
     * Scope a query to filter by truck.
     */
    public function scopeForTruck($query, $truckId)
    {
        return $query->where('truck_id', $truckId);
    }

    /**
     * Get the total fuel cost for this analysis.
     */
    public function getTotalFuelCostAttribute()
    {
        return $this->total_distance_km * $this->fuel_cost_per_km;
    }

    /**
     * Get the fuel efficiency percentage compared to target.
     */
    public function getFuelEfficiencyPercentageAttribute()
    {
        $targetEfficiency = 5.0; // Target: 5 km per liter
        if ($this->fuel_efficiency_km_per_liter > 0) {
            return ($this->fuel_efficiency_km_per_liter / $targetEfficiency) * 100;
        }

        return 0;
    }
}
