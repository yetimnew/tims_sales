<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TruckFinancialRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'truck_id',
        'record_date',
        'revenue',
        'fuel_cost',
        'maintenance_cost',
        'driver_salary',
        'insurance_cost',
        'depreciation',
        'other_costs',
        'net_profit',
        'period_type',
    ];

    protected $casts = [
        'record_date' => 'date',
        'revenue' => 'decimal:2',
        'fuel_cost' => 'decimal:2',
        'maintenance_cost' => 'decimal:2',
        'driver_salary' => 'decimal:2',
        'insurance_cost' => 'decimal:2',
        'depreciation' => 'decimal:2',
        'other_costs' => 'decimal:2',
        'net_profit' => 'decimal:2',
    ];

    /**
     * Get the truck that owns the financial record.
     */
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    /**
     * Scope a query to only include daily records.
     */
    public function scopeDaily($query)
    {
        return $query->where('period_type', 'daily');
    }

    /**
     * Scope a query to only include weekly records.
     */
    public function scopeWeekly($query)
    {
        return $query->where('period_type', 'weekly');
    }

    /**
     * Scope a query to only include monthly records.
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
        return $query->whereBetween('record_date', [$startDate, $endDate]);
    }

    /**
     * Scope a query to filter by truck.
     */
    public function scopeForTruck($query, $truckId)
    {
        return $query->where('truck_id', $truckId);
    }

    /**
     * Get the total costs.
     */
    public function getTotalCostsAttribute()
    {
        return $this->fuel_cost + $this->maintenance_cost + $this->driver_salary +
               $this->insurance_cost + $this->depreciation + $this->other_costs;
    }

    /**
     * Get the profit margin percentage.
     */
    public function getProfitMarginAttribute()
    {
        if ($this->revenue > 0) {
            return ($this->net_profit / $this->revenue) * 100;
        }
        return 0;
    }

    /**
     * Get the cost per kilometer.
     */
    public function getCostPerKmAttribute()
    {
        // This would need distance data to calculate
        return 0;
    }

    /**
     * Get the revenue per kilometer.
     */
    public function getRevenuePerKmAttribute()
    {
        // This would need distance data to calculate
        return 0;
    }
}

