<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Zone extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'region_id',
        'status',
        'description',
    ];

    protected $casts = [
        'status' => 'string',
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



