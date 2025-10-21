<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'interval_km',
        'interval_months',
        'estimated_cost',
        'description',
        'is_active',
    ];

    protected $casts = [
        'estimated_cost' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get the maintenance records for the maintenance type.
     */
    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(VehicleMaintenanceRecord::class);
    }

    /**
     * Scope a query to only include active maintenance types.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include preventive maintenance types.
     */
    public function scopePreventive($query)
    {
        return $query->where('category', 'Preventive');
    }

    /**
     * Scope a query to only include corrective maintenance types.
     */
    public function scopeCorrective($query)
    {
        return $query->where('category', 'Corrective');
    }

    /**
     * Scope a query to only include emergency maintenance types.
     */
    public function scopeEmergency($query)
    {
        return $query->where('category', 'Emergency');
    }
}



