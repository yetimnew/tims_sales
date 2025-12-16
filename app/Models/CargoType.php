<?php

namespace App\Models;

use App\Enums\CargoCategory;
use App\Traits\ClearsCacheOnModelEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class CargoType extends Model
{
    use HasFactory, SoftDeletes, LogsActivity, ClearsCacheOnModelEvents;

    protected $fillable = [
        'name',
        'category',
        'weight_per_cubic_meter',
        'handling_requirements',
        'safety_requirements',
        'requires_special_equipment',
    ];

    protected $casts = [
        'weight_per_cubic_meter' => 'decimal:2',
        'requires_special_equipment' => 'boolean',
        'category' => CargoCategory::class,
    ];

    /**
     * Get the performances for the cargo type.
     */
    public function performances(): HasMany
    {
        return $this->hasMany(Performance::class);
    }

    /**
     * Scope a query to only include construction cargo types.
     */
    public function scopeConstruction($query)
    {
        return $query->where('category', CargoCategory::Construction->value);
    }

    /**
     * Scope a query to only include agricultural cargo types.
     */
    public function scopeAgricultural($query)
    {
        return $query->where('category', CargoCategory::Agricultural->value);
    }

    /**
     * Scope a query to only include industrial cargo types.
     */
    public function scopeIndustrial($query)
    {
        return $query->where('category', CargoCategory::Industrial->value);
    }

    /**
     * Scope a query to only include cargo types requiring special equipment.
     */
    public function scopeRequiresSpecialEquipment($query)
    {
        return $query->where('requires_special_equipment', true);
    }

    /**
     * Calculate cargo weight from volume.
     */
    public function calculateWeightFromVolume($volumeCubicMeters)
    {
        if ($this->weight_per_cubic_meter && $volumeCubicMeters > 0) {
            return $volumeCubicMeters * $this->weight_per_cubic_meter;
        }
        return null;
    }

    /**
     * Calculate cargo volume from weight.
     */
    public function calculateVolumeFromWeight($weightKg)
    {
        if ($this->weight_per_cubic_meter && $weightKg > 0) {
            return $weightKg / $this->weight_per_cubic_meter;
        }
        return null;
    }

    /**
     * Get the handling requirements as an array.
     */
    public function getHandlingRequirementsArrayAttribute()
    {
        if ($this->handling_requirements) {
            return explode(',', $this->handling_requirements);
        }
        return [];
    }

    /**
     * Get the safety requirements as an array.
     */
    public function getSafetyRequirementsArrayAttribute()
    {
        if ($this->safety_requirements) {
            return explode(',', $this->safety_requirements);
        }
        return [];
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'category', 'weight_per_cubic_meter', 'handling_requirements', 'safety_requirements', 'requires_special_equipment'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('cargo_types');
    }
}



