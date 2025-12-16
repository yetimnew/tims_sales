<?php

namespace App\Models;

use App\Enums\CargoServiceType;
use App\Enums\OperationDestinationScope;
use App\Traits\ClearsCacheOnModelEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Operation extends Model
{
    use HasFactory, LogsActivity, SoftDeletes, ClearsCacheOnModelEvents;

    protected $guarded = [];

    protected $casts = [
        'startdate' => 'date',
        'enddate' => 'date',
        'volume' => 'decimal:2',
        'km' => 'decimal:2',
        'tariff' => 'decimal:2',
        'closed' => 'boolean',
        'destination_scope' => OperationDestinationScope::class,
        'cargo_service_type' => CargoServiceType::class,
    ];

    /**
     * Get the customer that owns the operation.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the user that owns the operation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the performances for the operation.
     */
    public function performances(): HasMany
    {
        return $this->hasMany(Performance::class);
    }

    /**
     * Get the outsource performances for the operation.
     */
    public function outsourcePerformances(): HasMany
    {
        return $this->hasMany(OutsourcePerformance::class);
    }

    public function cargoType(): BelongsTo
    {
        return $this->belongsTo(CargoType::class);
    }

    public function destinationReference(): MorphTo
    {
        return $this->morphTo('destination_reference');
    }

    /**
     * Scope a query to only include active operations.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include closed operations.
     */
    public function scopeClosed($query)
    {
        return $query->where('closed', true);
    }

    /**
     * Scope a query to only include open operations.
     */
    public function scopeOpen($query)
    {
        return $query->where('closed', false);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*'])
            ->useLogName('operation')
            ->setDescriptionForEvent(fn (string $eventName) => "This model has been {$eventName}");
    }
}
