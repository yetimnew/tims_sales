<?php

namespace App\Models;

use App\Traits\ClearsCacheOnModelEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class VehicleMaintenanceRecord extends Model
{
    use HasFactory, SoftDeletes, LogsActivity, ClearsCacheOnModelEvents;

    protected $appends = [
        'days_until_scheduled',
        'is_overdue',
        'computed_status',
    ];

    protected $fillable = [
        'truck_id',
        'maintenance_type_id',
        'scheduled_date',
        'completed_date',
        'odometer_reading',
        'cost',
        'description',
        'work_performed',
        'parts_replaced',
        'service_provider',
        'status',
        'driver_acknowledged_at',
        'driver_acknowledged_by_user_id',
        'driver_issue_reported_at',
        'driver_issue_reported_by_user_id',
        'driver_issue_report',
        'driver_service_requested_at',
        'driver_service_requested_by_user_id',
        'driver_service_request_notes',
        'mobile_request_status',
        'mobile_request_reviewed_at',
        'mobile_request_reviewed_by_user_id',
        'mobile_request_review_note',
        'assigned_mechanic_id',
        'user_id',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_date' => 'date',
        'driver_acknowledged_at' => 'datetime',
        'driver_issue_reported_at' => 'datetime',
        'driver_service_requested_at' => 'datetime',
        'mobile_request_reviewed_at' => 'datetime',
        'cost' => 'decimal:2',
    ];

    /**
     * Get the truck that owns the maintenance record.
     */
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    /**
     * Get the maintenance type that owns the maintenance record.
     */
    public function maintenanceType(): BelongsTo
    {
        return $this->belongsTo(MaintenanceType::class);
    }

    /**
     * Get the assigned mechanic that owns the maintenance record.
     */
    public function assignedMechanic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_mechanic_id');
    }

    /**
     * Get the user that owns the maintenance record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include scheduled maintenance.
     */
    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    /**
     * Scope a query to only include completed maintenance.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope a query to only include overdue maintenance.
     */
    public function scopeOverdue($query)
    {
        return $query->whereIn('status', ['scheduled', 'overdue'])
            ->whereNull('completed_date')
            ->where('scheduled_date', '<', now());
    }

    /**
     * Scope a query to only include upcoming maintenance.
     */
    public function scopeUpcoming($query, $days = 7)
    {
        return $query->whereIn('status', ['scheduled', 'overdue'])
            ->whereNull('completed_date')
            ->whereBetween('scheduled_date', [now(), now()->addDays($days)]);
    }

    /**
     * Get the days until scheduled date.
     */
    public function getDaysUntilScheduledAttribute()
    {
        if ($this->scheduled_date) {
            return now()->diffInDays($this->scheduled_date, false);
        }
        return null;
    }

    /**
     * Check if maintenance is overdue.
     */
    public function getIsOverdueAttribute()
    {
        return in_array($this->status, ['scheduled', 'overdue'], true)
            && $this->completed_date === null
            && $this->scheduled_date < now();
    }

    public function getComputedStatusAttribute(): string
    {
        if ($this->status === 'completed' || $this->completed_date !== null) {
            return 'completed';
        }

        if ($this->status === 'in_progress') {
            return 'in_progress';
        }

        if ($this->is_overdue) {
            return 'overdue';
        }

        if (in_array($this->status, ['scheduled', 'overdue'], true)) {
            return 'scheduled';
        }

        return (string) $this->status;
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['scheduled_date', 'completed_date', 'cost', 'description', 'status', 'work_performed', 'parts_replaced'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('maintenance');
    }
}
