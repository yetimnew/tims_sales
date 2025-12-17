<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverTruckGradeSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'snapshot_date',
        'driver_truck_id',
        'driver_id',
        'truck_id',
        'status',
        'is_attached',
        'filter_status',
        'filter_is_attached',
        'overall_score',
        'overall_letter',
        'weights',
        'categories',
        'metrics',
        'grade_thresholds',
        'calculated_at',
        'calculated_by',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'is_attached' => 'boolean',
        'filter_is_attached' => 'boolean',
        'overall_score' => 'float',
        'weights' => 'array',
        'categories' => 'array',
        'metrics' => 'array',
        'grade_thresholds' => 'array',
        'calculated_at' => 'datetime',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(DriverTruck::class, 'driver_truck_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function calculatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'calculated_by');
    }
}
