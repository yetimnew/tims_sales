<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OutsourcePerformance extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'outsource_id',
        'operation_id',
        'trip_number',
        'dispatch_date',
        'from_place_id',
        'to_place_id',
        'distance_km',
        'cargo_volume_mt',
        'tonkm',
        'cost',
        'remarks',
        'status',
        'user_id',
    ];

    protected $casts = [
        'dispatch_date' => 'date',
        'distance_km' => 'decimal:2',
        'cargo_volume_mt' => 'decimal:2',
        'tonkm' => 'decimal:2',
        'cost' => 'decimal:2',
    ];

    /**
     * Get the outsource that owns the performance.
     */
    public function outsource(): BelongsTo
    {
        return $this->belongsTo(Outsource::class);
    }

    /**
     * Get the operation that owns the performance.
     */
    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }

    /**
     * Get the user that owns the performance.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the from place that owns the performance.
     */
    public function fromPlace(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'from_place_id');
    }

    /**
     * Get the to place that owns the performance.
     */
    public function toPlace(): BelongsTo
    {
        return $this->belongsTo(Place::class, 'to_place_id');
    }
}

