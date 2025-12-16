<?php

namespace App\Models;

use App\Traits\ClearsCacheOnModelEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Zone extends Model
{
    use HasFactory, SoftDeletes, ClearsCacheOnModelEvents;

    protected $fillable = [
        'name',
        'code',
        'region_id',
        'status',
        'description',
        'administrative_center',
        'area_km2',
        'population',
        'latitude',
        'longitude',
        'elevation_m',
        'accessibility_score',
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
    ];

    /**
     * Get the region that owns the zone.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    /**
     * Get the woredas for the zone.
     */
    public function woredas(): HasMany
    {
        return $this->hasMany(Woreda::class);
    }

    /**
     * Scope to get only active zones.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter by region.
     */
    public function scopeByRegion($query, $regionId)
    {
        return $query->where('region_id', $regionId);
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



