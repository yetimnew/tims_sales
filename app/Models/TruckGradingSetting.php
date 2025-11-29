<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TruckGradingSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'utilization_weight',
        'efficiency_weight',
        'reliability_weight',
        'financial_weight',
        'compliance_weight',
        'peer_sample_size',
        'updated_by',
    ];

    protected $casts = [
        'utilization_weight' => 'integer',
        'efficiency_weight' => 'integer',
        'reliability_weight' => 'integer',
        'financial_weight' => 'integer',
        'compliance_weight' => 'integer',
        'peer_sample_size' => 'integer',
        'updated_by' => 'integer',
    ];

    public static function defaultWeights(): array
    {
        return [
            'utilization_weight' => 25,
            'efficiency_weight' => 25,
            'reliability_weight' => 30,
            'financial_weight' => 15,
            'compliance_weight' => 5,
            'peer_sample_size' => 10,
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
