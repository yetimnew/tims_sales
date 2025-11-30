<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverGradingSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'performance_weight',
        'efficiency_weight',
        'safety_weight',
        'compliance_weight',
        'engagement_weight',
        'peer_sample_size',
        'updated_by',
    ];

    protected $casts = [
        'performance_weight' => 'integer',
        'efficiency_weight' => 'integer',
        'safety_weight' => 'integer',
        'compliance_weight' => 'integer',
        'engagement_weight' => 'integer',
        'peer_sample_size' => 'integer',
        'updated_by' => 'integer',
    ];

    public static function defaultWeights(): array
    {
        return [
            'performance_weight' => 35,
            'efficiency_weight' => 20,
            'safety_weight' => 25,
            'compliance_weight' => 10,
            'engagement_weight' => 10,
            'peer_sample_size' => 10,
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
