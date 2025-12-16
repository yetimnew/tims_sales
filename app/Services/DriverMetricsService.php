<?php

namespace App\Services;

use App\Models\Driver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class DriverMetricsService
{
    public function metrics(?string $search, ?string $sex, ?string $status): array
    {
        $filters = [
            'search' => $this->normalizeSearch($search),
            'sex' => $this->normalizeSex($sex),
            'status' => $this->normalizeStatus($status),
        ];

        $version = Cache::get('driver_metrics_version', 0);
        $cacheKey = 'driver_metrics:' . $version . ':' . md5(json_encode($filters));

        return Cache::remember($cacheKey, 300, function () use ($filters) {
            $query = Driver::query();
            $this->applyFilters($query, $filters['search'], $filters['sex'], $filters['status']);

            $metricsRow = $query
                ->selectRaw('COUNT(*) as total_count')
                ->selectRaw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count")
                ->selectRaw("SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_count")
                ->selectRaw("SUM(CASE WHEN sex = 'male' THEN 1 ELSE 0 END) as male_count")
                ->selectRaw("SUM(CASE WHEN sex = 'female' THEN 1 ELSE 0 END) as female_count")
                ->first();

            return [
                'total' => (int) ($metricsRow->total_count ?? 0),
                'active' => (int) ($metricsRow->active_count ?? 0),
                'inactive' => (int) ($metricsRow->inactive_count ?? 0),
                'male' => (int) ($metricsRow->male_count ?? 0),
                'female' => (int) ($metricsRow->female_count ?? 0),
            ];
        });
    }

    public function applyFilters(Builder $query, ?string $search, ?string $sex, ?string $status): Builder
    {
        $search = $this->normalizeSearch($search);
        $sex = $this->normalizeSex($sex);
        $status = $this->normalizeStatus($status);

        if ($search !== null) {
            $query->where(function (Builder $inner) use ($search) {
                // Use prefix matching for better index usage when search is 3+ characters
                if (strlen($search) >= 3) {
                    $inner->where('name', 'like', "{$search}%")
                        ->orWhere('driverid', 'like', "{$search}%")
                        ->orWhere('mobile', 'like', "{$search}%")
                        ->orWhere('zone', 'like', "{$search}%");
                } else {
                    // Fallback to full wildcard for short searches
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('driverid', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%")
                        ->orWhere('zone', 'like', "%{$search}%");
                }
            });
        }

        if ($sex !== null) {
            $query->where('sex', $sex);
        }

        if ($status !== null) {
            $query->where('status', $status);
        }

        return $query;
    }

    public function clearCache(): void
    {
        // Clear driver metrics cache by incrementing version key
        // This invalidates all cached metrics without flushing entire cache
        Cache::forever('driver_metrics_version', time());
        
        // Note: For Redis/Memcached with tags support, use: Cache::tags(['driver_metrics'])->flush();
        // For better performance with Redis, implement pattern-based clearing
    }

    private function normalizeSearch(?string $search): ?string
    {
        if ($search === null) {
            return null;
        }

        $value = trim($search);

        return $value === '' ? null : $value;
    }

    private function normalizeSex(?string $sex): ?string
    {
        if ($sex === null) {
            return null;
        }

        $value = strtolower(trim($sex));

        return $value === '' || $value === 'all' ? null : $value;
    }

    private function normalizeStatus(?string $status): ?string
    {
        if ($status === null) {
            return null;
        }

        $value = strtolower(trim($status));

        return $value === '' || $value === 'all' ? null : $value;
    }
}
