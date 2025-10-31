<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Status extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'statustype_id',
        'name',
        'description',
    ];

    /**
     * Get the status type that owns the status.
     */
    public function statusType(): BelongsTo
    {
        return $this->belongsTo(StatusType::class, 'statustype_id');
    }

    /**
     * Get the daily truck statuses for this status.
     */
    public function dailyTruckStatuses(): HasMany
    {
        return $this->hasMany(DailyTruckStatus::class);
    }
}



