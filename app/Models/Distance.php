<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Distance extends Model
{
    use HasFactory;

    protected $fillable = [
        'from_place_id',
        'to_place_id',
        'distance_km',
        'estimated_time_hours',
        'route_description',
    ];

    protected $casts = [
        'distance_km' => 'decimal:2',
        'estimated_time_hours' => 'decimal:2',
    ];

    /**
     * Get the from place that owns the distance.
     */
    public function fromPlace(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'from_place_id');
    }

    /**
     * Get the to place that owns the distance.
     */
    public function toPlace(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'to_place_id');
    }
}



