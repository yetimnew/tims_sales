<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Operation extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'startdate' => 'date',
        'enddate' => 'date',
        'volume' => 'decimal:2',
        'km' => 'decimal:2',
        'tariff' => 'decimal:2',
        'closed' => 'boolean',
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
     * Get the region that owns the operation.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
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
}



