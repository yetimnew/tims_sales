<?php

namespace App\Services;

use App\Models\Status;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class StatusMetricsService
{
    private const RECENT_DAYS = 30;

    /**
     * @var array<string, array<string, mixed>>
     */
    private array $metricsCache = [];

    public function metrics(?string $search, ?int $statusTypeId): array
    {
        $filters = [
            'search' => $this->normalizeSearch($search),
            'statustype_id' => $statusTypeId,
        ];

        $cacheKey = md5(json_encode($filters));

        if (isset($this->metricsCache[$cacheKey])) {
            return $this->metricsCache[$cacheKey];
        }

        $baseQuery = Status::query();
        $this->applyFilters($baseQuery, $filters['search'], $filters['statustype_id']);

        $total = (clone $baseQuery)->count('id');
        $inUse = (clone $baseQuery)->whereHas('dailyTruckStatuses')->count('id');
        $recentThreshold = Carbon::now()->subDays(self::RECENT_DAYS);
        $recent = (clone $baseQuery)->whereDate('created_at', '>=', $recentThreshold)->count('id');
        $uniqueTypes = (clone $baseQuery)->distinct('statustype_id')->count('statustype_id');

        $withDescription = (clone $baseQuery)
            ->whereNotNull('description')
            ->where('description', '!=', '')
            ->count('id');

        $metrics = [
            'total' => $total,
            'in_use' => $inUse,
            'unique_types' => $uniqueTypes,
            'recent' => $recent,
            'recent_days' => self::RECENT_DAYS,
            'with_description' => $withDescription,
            'without_description' => max($total - $withDescription, 0),
            'average_per_type' => $uniqueTypes > 0 ? round($total / $uniqueTypes, 2) : 0.0,
        ];

        return $this->metricsCache[$cacheKey] = $metrics;
    }

    public function clearCache(): void
    {
        $this->metricsCache = [];
    }

    private function applyFilters(Builder $query, ?string $search, ?int $statusTypeId): void
    {
        if ($search !== null) {
            $query->where(function (Builder $inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($statusTypeId !== null) {
            $query->where('statustype_id', $statusTypeId);
        }
    }

    private function normalizeSearch(?string $search): ?string
    {
        if ($search === null) {
            return null;
        }

        $value = trim($search);

        return $value === '' ? null : $value;
    }
}
