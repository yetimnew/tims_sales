<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Place extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'name',
        'code',
        'woreda_id',
        'status',
        'latitude',
        'longitude',
        'elevation_m',
        'population',
        'is_logistics_hub',
        'accessibility_score',
        'description',
        'infrastructure_notes',
        'road_quality_notes',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'elevation_m' => 'decimal:2',
        'population' => 'integer',
        'is_logistics_hub' => 'boolean',
        'accessibility_score' => 'decimal:2',
        'status' => 'string',
    ];

    /**
     * Get the woreda that owns the place.
     */
    public function woreda(): BelongsTo
    {
        return $this->belongsTo(Woreda::class);
    }

    /**
     * Get the performances where this place is the origin.
     */
    public function originPerformances(): HasMany
    {
        return $this->hasMany(Performance::class, 'orgion_id');
    }

    /**
     * Get the performances where this place is the destination.
     */
    public function destinationPerformances(): HasMany
    {
        return $this->hasMany(Performance::class, 'destination_id');
    }

    /**
     * Get the distances from this place.
     */
    public function fromDistances(): HasMany
    {
        return $this->hasMany(Distance::class, 'from_place_id');
    }

    /**
     * Get the distances to this place.
     */
    public function toDistances(): HasMany
    {
        return $this->hasMany(Distance::class, 'to_place_id');
    }

    /**
     * Scope to get only active places.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter by woreda.
     */
    public function scopeByWoreda($query, $woredaId)
    {
        return $query->where('woreda_id', $woredaId);
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

    /**
     * Scope to filter by coordinates (within bounding box).
     */
    public function scopeWithinBounds($query, $lat1, $lon1, $lat2, $lon2)
    {
        return $query->whereBetween('latitude', [min($lat1, $lat2), max($lat1, $lat2)])
                    ->whereBetween('longitude', [min($lon1, $lon2), max($lon1, $lon2)]);
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'name',
                'code',
                'woreda_id',
                'status',
                'latitude',
                'longitude',
                'elevation_m',
                'population',
                'is_logistics_hub',
                'accessibility_score',
                'description',
                'infrastructure_notes',
                'road_quality_notes'
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('places');
    }
}



