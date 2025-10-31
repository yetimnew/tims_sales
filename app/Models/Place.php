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
        'latitude',
        'longitude',
        'description',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
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
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'name',
                'code',
                'woreda_id',
                'latitude',
                'longitude',
                'description'
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('places');
    }
}



