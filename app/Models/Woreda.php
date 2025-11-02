<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Woreda extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'zone_id',
        'status',
        'description',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    /**
     * Get the zone that owns the woreda.
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    /**
     * Get the places for the woreda.
     */
    public function places(): HasMany
    {
        return $this->hasMany(Place::class);
    }

    /**
     * Scope to get only active woredas.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter by zone.
     */
    public function scopeByZone($query, $zoneId)
    {
        return $query->where('zone_id', $zoneId);
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



