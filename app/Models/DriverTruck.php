<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DriverTruck extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'driver_truck';

    protected $fillable = [
        'driver_id',
        'truck_id',
        'assigned_date',
        'unassigned_date',
        'status',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'unassigned_date' => 'date',
    ];

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
     * Scope a query to only include active assignments.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include attached assignments.
     */
    public function scopeIsAttached($query)
    {
        return $query->where('status', 'active')
            ->whereNull('unassigned_date');
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
}

