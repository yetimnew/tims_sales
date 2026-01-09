<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'status_type',
        'status_value',
        'notes',
    ];

    /**
     * Get the driver that owns the status history.
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
