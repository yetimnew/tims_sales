<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverGradeSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'snapshot_date',
        'driver_id',
        'status',
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

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function calculatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'calculated_by');
    }
}
