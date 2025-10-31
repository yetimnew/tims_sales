<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Status extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

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

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'statustype_id',
                'name',
                'description'
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('statuses');
    }
}



