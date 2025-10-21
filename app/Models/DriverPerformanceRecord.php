<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverPerformanceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'truck_id',
        'record_date',
        'total_trips',
        'total_distance_km',
        'total_cargo_tonnage',
        'fuel_efficiency',
        'safety_violations',
        'accidents',
        'customer_rating',
        'performance_notes',
        'period_type',
    ];

    protected $casts = [
        'record_date' => 'date',
        'total_distance_km' => 'decimal:2',
        'total_cargo_tonnage' => 'decimal:2',
        'fuel_efficiency' => 'decimal:2',
        'customer_rating' => 'decimal:2',
    ];

    /**
     * Get the driver that owns the performance record.
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * Get the truck that owns the performance record.
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
     * Scope a query to filter by driver.
     */
    public function scopeForDriver($query, $driverId)
    {
        return $query->where('driver_id', $driverId);
    }

    /**
     * Scope a query to filter by truck.
     */
    public function scopeForTruck($query, $truckId)
    {
        return $query->where('truck_id', $truckId);
    }

    /**
     * Get the performance score based on various metrics.
     */
    public function getPerformanceScoreAttribute()
    {
        $score = 0;

        // Fuel efficiency score (0-30 points)
        if ($this->fuel_efficiency > 0) {
            $score += min(30, ($this->fuel_efficiency / 5.0) * 30);
        }

        // Safety score (0-30 points)
        $safetyScore = 30 - ($this->safety_violations * 5) - ($this->accidents * 10);
        $score += max(0, $safetyScore);

        // Customer rating score (0-20 points)
        if ($this->customer_rating > 0) {
            $score += ($this->customer_rating / 5.0) * 20;
        }

        // Productivity score (0-20 points)
        if ($this->total_trips > 0) {
            $score += min(20, ($this->total_trips / 10.0) * 20);
        }

        return min(100, $score);
    }

    /**
     * Get the performance grade.
     */
    public function getPerformanceGradeAttribute()
    {
        $score = $this->performance_score;

        if ($score >= 90) return 'A+';
        if ($score >= 80) return 'A';
        if ($score >= 70) return 'B+';
        if ($score >= 60) return 'B';
        if ($score >= 50) return 'C+';
        if ($score >= 40) return 'C';
        return 'D';
    }
}



