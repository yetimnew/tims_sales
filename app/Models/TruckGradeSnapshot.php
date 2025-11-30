<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TruckGradeSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'snapshot_date',
        'truck_id',
        'vehicle_type_id',
        'status',
        'filter_vehicle_type_id',
        'filter_status',
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
        'overall_score' => 'float',
        'weights' => 'array',
        'categories' => 'array',
        'metrics' => 'array',
        'grade_thresholds' => 'array',
        'calculated_at' => 'datetime',
    ];

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class, 'vehicle_type_id');
    }

    public function filterVehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class, 'filter_vehicle_type_id');
    }

    public function calculatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'calculated_by');
    }
}
