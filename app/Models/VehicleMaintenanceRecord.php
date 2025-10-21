<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class VehicleMaintenanceRecord extends Model
{
    use HasFactory, SoftDeletes;

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
        'assigned_mechanic_id',
        'user_id',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_date' => 'date',
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
        return $query->where('status', 'scheduled')
            ->where('scheduled_date', '<', now());
    }

    /**
     * Scope a query to only include upcoming maintenance.
     */
    public function scopeUpcoming($query, $days = 7)
    {
        return $query->where('status', 'scheduled')
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
        return $this->status === 'scheduled' && $this->scheduled_date < now();
    }
}



