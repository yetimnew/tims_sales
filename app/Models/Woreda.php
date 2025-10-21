<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Woreda extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'zone_id',
        'description',
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
}

