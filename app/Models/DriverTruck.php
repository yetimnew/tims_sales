<?php

namespace App\Models;

use DateTime;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class DriverTruck extends Model
{
    use HasFactory, LogsActivity, SoftDeletes;

    protected $table = 'driver_truck';

    protected $fillable = [
        'id',
        'driver_id',
        'driverid',
        'truck_id',
        'plate',
        'date_recived',
        'date_detach',
        'reason',
        'is_attached',
        'status',
        'user_id',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'unassigned_date' => 'date',
        'date_recived' => 'date',
        'date_detach' => 'date',
        'is_attached' => 'boolean',
    ];

    protected $dates = ['deleted_at', 'assigned_date', 'unassigned_date', 'date_recived', 'date_detach'];

    /**
     * Get the driver that owns the assignment.
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * Get the truck that owns the assignment.
     */
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    /**
     * Get the performances for the driver-truck assignment.
     */
    public function performances(): HasMany
    {
        return $this->hasMany(Performance::class);
    }

    /**
     * Get the fuel records associated with the assignment.
     */
    public function fuelRecords(): HasMany
    {
        return $this->hasMany(FuelRecord::class);
    }

    /**
     * Get the date difference attribute.
     */
    public function getDateDifferenceAttribute()
    {
        if ($this->unassigned_date) {
            return $this->assigned_date->diffInDays($this->unassigned_date);
        }

        return $this->assigned_date->diffInDays(now());
    }

    /**
     * Scope a query to only include active assignments.
     */
    public function scopeActive($query)
    {
        return $query->where('status', '=', 'active');
    }

    /**
     * Scope a query to only include attached assignments.
     */
    public function scopeIsAttached($query)
    {
        return $query->where('is_attached', '=', 1);
    }

    /**
     * Get the date difference in formatted string.
     */
    public function getFormattedDateDifferenceAttribute()
    {
        if (! $this->date_recived) {
            return 'N/A';
        }

        $date_recived = new DateTime($this->date_recived);
        $date_detach = $this->date_detach ? new DateTime($this->date_detach) : new DateTime;

        $diff = $date_detach->diff($date_recived);

        return $diff->d.' days '.$diff->h.' hours '.$diff->i.' minutes';
    }

    /**
     * Configure activity logging.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'driver_id',
                'truck_id',
                'plate',
                'driverid',
                'date_recived',
                'date_detach',
                'reason',
                'is_attached',
                'status',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('driver_trucks');
    }
}
