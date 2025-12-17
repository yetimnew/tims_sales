<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverTruckGradingSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'performance_weight',
        'efficiency_weight',
        'consistency_weight',
        'peer_sample_size',
        'grade_thresholds',
        'updated_by',
    ];

    protected $casts = [
        'performance_weight' => 'integer',
        'efficiency_weight' => 'integer',
        'consistency_weight' => 'integer',
        'peer_sample_size' => 'integer',
        'grade_thresholds' => 'array',
        'updated_by' => 'integer',
    ];

    public static function defaultWeights(): array
    {
        return [
            'performance_weight' => 40,
            'efficiency_weight' => 35,
            'consistency_weight' => 25,
            'peer_sample_size' => 25,
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
