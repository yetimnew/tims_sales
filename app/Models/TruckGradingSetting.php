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
        'min_performance_records',
        'min_days_in_service',
        'grade_thresholds',
        'updated_by',
    ];

    protected $casts = [
        'utilization_weight' => 'integer',
        'efficiency_weight' => 'integer',
        'reliability_weight' => 'integer',
        'financial_weight' => 'integer',
        'compliance_weight' => 'integer',
        'peer_sample_size' => 'integer',
        'min_performance_records' => 'integer',
        'min_days_in_service' => 'integer',
        'grade_thresholds' => 'array',
        'updated_by' => 'integer',
    ];

    public static function defaultWeights(): array
    {
        return [
            'utilization_weight' => 35,
            'efficiency_weight' => 35,
            'reliability_weight' => 5,
            'financial_weight' => 20,
            'compliance_weight' => 5,
            'peer_sample_size' => 10,
        ];
    }

    public static function defaultGradeThresholds(): array
    {
        return [
            'A' => 90,
            'B' => 80,
            'C' => 70,
            'D' => 60,
            'E' => 0,
        ];
    }

    public static function normalizeGradeThresholds(?array $candidate, ?array $fallback = null): array
    {
        $fallback ??= self::defaultGradeThresholds();

        $letters = ['A', 'B', 'C', 'D', 'E'];
        $normalized = [];

        foreach ($letters as $letter) {
            $value = $candidate[$letter] ?? $candidate[strtolower($letter)] ?? null;

            if (! is_numeric($value)) {
                $value = $fallback[$letter] ?? null;
            }

            $normalized[$letter] = $value !== null
                ? max(min((float) $value, 100), 0)
                : ($fallback[$letter] ?? 0);
        }

        $previous = 100.0;

        foreach ($letters as $letter) {
            $current = $normalized[$letter];

            if ($current > $previous) {
                $normalized[$letter] = $previous;
            }

            $previous = $normalized[$letter];
        }

        $normalized['E'] = 0.0;

        return $normalized;
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
