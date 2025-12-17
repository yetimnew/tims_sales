<?php

namespace App\Services;

use App\Models\Status;
use App\Models\StatusType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class StatusTypeMetricsService
{
    private const RECENT_DAYS = 30;

    /**
     * @var array<string, array<string, mixed>>
     */
    private array $metricsCache = [];

    public function metrics(?string $search, ?string $usage): array
    {
        $filters = [
            'search' => $this->normalizeSearch($search),
            'usage' => $this->normalizeUsage($usage),
        ];

        $cacheKey = md5(json_encode($filters));

        if (isset($this->metricsCache[$cacheKey])) {
            return $this->metricsCache[$cacheKey];
        }

        $baseQuery = StatusType::query();
        $this->applyFilters($baseQuery, $filters['search'], $filters['usage']);

        $total = (clone $baseQuery)->count('id');
        $inUse = (clone $baseQuery)->whereHas('statuses')->count('id');
        $unused = max($total - $inUse, 0);

        $recentThreshold = Carbon::now()->subDays(self::RECENT_DAYS);
        $recent = (clone $baseQuery)
            ->whereDate('created_at', '>=', $recentThreshold)
            ->count('id');

        $statusTypeIds = (clone $baseQuery)->pluck('id');

        $statusesTotal = $statusTypeIds->isEmpty()
            ? 0
            : Status::query()->whereIn('statustype_id', $statusTypeIds)->count('id');

        $metrics = [
            'total' => $total,
            'in_use' => $inUse,
            'unused' => $unused,
            'recent' => $recent,
            'recent_days' => self::RECENT_DAYS,
            'statuses_total' => $statusesTotal,
            'average_per_type' => $total > 0 ? round($statusesTotal / $total, 2) : 0.0,
        ];

        $this->metricsCache[$cacheKey] = $metrics;

        return $metrics;
    }

    public function applyFilters(Builder $query, ?string $search, ?string $usage): Builder
    {
        $search = $this->normalizeSearch($search);
        $usage = $this->normalizeUsage($usage);

        if ($search !== null) {
            $query->where(function (Builder $inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($usage === 'in_use') {
            $query->whereHas('statuses');
        } elseif ($usage === 'unused') {
            $query->doesntHave('statuses');
        }

        return $query;
    }

    public function clearCache(): void
    {
        $this->metricsCache = [];
    }

    private function normalizeSearch(?string $search): ?string
    {
        if ($search === null) {
            return null;
        }

        $value = trim($search);

        return $value === '' ? null : $value;
    }

    private function normalizeUsage(?string $usage): ?string
    {
        if ($usage === null) {
            return null;
        }

        $value = strtolower(trim($usage));

        return in_array($value, ['in_use', 'unused'], true) ? $value : null;
    }
}
