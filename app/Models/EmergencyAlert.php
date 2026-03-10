<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmergencyAlert extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_ACKNOWLEDGED = 'acknowledged';

    public const STATUS_RESOLVED = 'resolved';

    public const STATUS_FALSE_ALARM = 'false_alarm';

    protected $fillable = [
        'driver_id',
        'user_id',
        'truck_id',
        'driver_truck_id',
        'alert_code',
        'latitude',
        'longitude',
        'location_missing',
        'message',
        'status',
        'acknowledged_at',
        'acknowledged_by_user_id',
        'resolved_at',
        'resolved_by_user_id',
        'false_alarm_at',
        'false_alarm_by_user_id',
        'resolution_notes',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'location_missing' => 'boolean',
        'acknowledged_at' => 'datetime',
        'resolved_at' => 'datetime',
        'false_alarm_at' => 'datetime',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function driverTruck(): BelongsTo
    {
        return $this->belongsTo(DriverTruck::class);
    }

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by_user_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }

    public function falseAlarmBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'false_alarm_by_user_id');
    }
}
