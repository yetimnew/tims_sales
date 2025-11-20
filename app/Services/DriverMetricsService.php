<?php

namespace App\Services;

use App\Models\Driver;
use Illuminate\Database\Eloquent\Builder;

class DriverMetricsService
{
    private array $localMetrics = [];

    public function metrics(?string $search, ?string $sex, ?string $status): array
    {
        $filters = [
            'search' => $this->normalizeSearch($search),
            'sex' => $this->normalizeSex($sex),
            'status' => $this->normalizeStatus($status),
        ];

        $cacheKey = md5(json_encode($filters));

        if (array_key_exists($cacheKey, $this->localMetrics)) {
            return $this->localMetrics[$cacheKey];
        }

        $query = Driver::query();
        $this->applyFilters($query, $filters['search'], $filters['sex'], $filters['status']);

        $metricsRow = $query
            ->selectRaw('COUNT(*) as total_count')
            ->selectRaw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count")
            ->selectRaw("SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_count")
            ->selectRaw("SUM(CASE WHEN sex = 'male' THEN 1 ELSE 0 END) as male_count")
            ->selectRaw("SUM(CASE WHEN sex = 'female' THEN 1 ELSE 0 END) as female_count")
            ->first();

        $metrics = [
            'total' => (int) ($metricsRow->total_count ?? 0),
            'active' => (int) ($metricsRow->active_count ?? 0),
            'inactive' => (int) ($metricsRow->inactive_count ?? 0),
            'male' => (int) ($metricsRow->male_count ?? 0),
            'female' => (int) ($metricsRow->female_count ?? 0),
        ];

        $this->localMetrics[$cacheKey] = $metrics;

        return $metrics;
    }

    public function applyFilters(Builder $query, ?string $search, ?string $sex, ?string $status): Builder
    {
        $search = $this->normalizeSearch($search);
        $sex = $this->normalizeSex($sex);
        $status = $this->normalizeStatus($status);

        if ($search !== null) {
            $query->where(function (Builder $inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('driverid', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('zone', 'like', "%{$search}%");
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
        $this->localMetrics = [];
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
