<?php

namespace App\Models;

use App\Traits\ClearsCacheOnModelEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Region extends Model
{
    use HasFactory, SoftDeletes, ClearsCacheOnModelEvents;

    protected $fillable = [
        'name',
        'code',
        'status',
        'description',
        'capital',
        'area_km2',
        'population',
        'latitude',
        'longitude',
        'elevation_m',
        'accessibility_score',
        'last_surveyed_at',
        'infrastructure_notes',
        'climate_profile',
    ];

    protected $casts = [
        'status' => 'string',
        'area_km2' => 'decimal:2',
        'population' => 'integer',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'elevation_m' => 'decimal:2',
        'accessibility_score' => 'decimal:2',
        'last_surveyed_at' => 'date',
    ];

    /**
     * Get the zones for the region.
     */
    public function zones(): HasMany
    {
        return $this->hasMany(Zone::class);
    }

    /**
     * Get the operations for the region.
     */
    public function operations(): HasMany
    {
        return $this->hasMany(Operation::class);
    }

    /**
     * Scope to get only active regions.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter by name or code.
     */
    public function scopeByName($query, $name)
    {
        return $query->where(function ($q) use ($name) {
            $q->where('name', 'like', "%{$name}%")
                ->orWhere('code', 'like', "%{$name}%");
        });
    }
}



