<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class DriverSafetyRecord extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'driver_id',
        'incident_date',
        'incident_type',
        'description',
        'severity',
        'damage_cost',
        'location',
        'resolution',
        'reported_by',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'damage_cost' => 'decimal:2',
    ];

    /**
     * Get the driver that owns the safety record.
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * Get the user who reported the incident.
     */
    public function reportedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    /**
     * Scope a query to only include accidents.
     */
    public function scopeAccidents($query)
    {
        return $query->where('incident_type', 'accident');
    }

    /**
     * Scope a query to only include violations.
     */
    public function scopeViolations($query)
    {
        return $query->where('incident_type', 'violation');
    }

    /**
     * Scope a query to only include warnings.
     */
    public function scopeWarnings($query)
    {
        return $query->where('incident_type', 'warning');
    }

    /**
     * Scope a query to only include minor incidents.
     */
    public function scopeMinor($query)
    {
        return $query->where('severity', 'minor');
    }

    /**
     * Scope a query to only include major incidents.
     */
    public function scopeMajor($query)
    {
        return $query->where('severity', 'major');
    }

    /**
     * Scope a query to only include critical incidents.
     */
    public function scopeCritical($query)
    {
        return $query->where('severity', 'critical');
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('incident_date', [$startDate, $endDate]);
    }

    /**
     * Scope a query to filter by driver.
     */
    public function scopeForDriver($query, $driverId)
    {
        return $query->where('driver_id', $driverId);
    }

    /**
     * Get the severity weight for scoring.
     */
    public function getSeverityWeightAttribute()
    {
        return match($this->severity) {
            'minor' => 1,
            'major' => 3,
            'critical' => 5,
            default => 1
        };
    }

    /**
     * Get the incident type weight for scoring.
     */
    public function getIncidentTypeWeightAttribute()
    {
        return match($this->incident_type) {
            'warning' => 1,
            'violation' => 2,
            'accident' => 5,
            default => 1
        };
    }

    /**
     * Get the total safety score impact.
     */
    public function getSafetyScoreImpactAttribute()
    {
        return $this->severity_weight * $this->incident_type_weight;
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['driver_id', 'incident_date', 'incident_type', 'description', 'severity', 'damage_cost', 'location', 'resolution'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('driver_safety');
    }
}



