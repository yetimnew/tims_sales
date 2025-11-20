<?php

namespace App\Services;

use App\Models\Truck;
use Illuminate\Database\Eloquent\Builder;

class TruckMetricsService
{
    private array $localMetrics = [];

    public function metrics(?string $search, ?int $vehicleTypeId, ?string $status = null): array
    {
        $filters = [
            'search' => $search !== null && $search !== '' ? trim($search) : null,
            'vehicle_type' => $vehicleTypeId ?: null,
            'status' => $this->normalizeStatus($status),
        ];

        $cacheKey = md5(json_encode($filters));

        if (array_key_exists($cacheKey, $this->localMetrics)) {
            return $this->localMetrics[$cacheKey];
        }

        $query = Truck::query();
        $this->applyFilters($query, $filters['search'], $filters['vehicle_type'], $filters['status']);

        $metricsRow = $query
            ->selectRaw('COUNT(*) as total_count')
            ->selectRaw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count")
            ->selectRaw("SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count")
            ->selectRaw('COALESCE(SUM(purchasePrice), 0) as fleet_value_sum')
            ->first();

        $metrics = [
            'total' => (int) ($metricsRow->total_count ?? 0),
            'active' => (int) ($metricsRow->active_count ?? 0),
            'maintenance' => (int) ($metricsRow->maintenance_count ?? 0),
            'fleet_value' => (float) ($metricsRow->fleet_value_sum ?? 0.0),
        ];

        $this->localMetrics[$cacheKey] = $metrics;

        return $metrics;
    }

    public function applyFilters(Builder $query, ?string $search, ?int $vehicleTypeId, ?string $status = null): Builder
    {
        $search = $search !== null ? trim($search) : '';
        if ($search !== '') {
            $query->where(function ($inner) use ($search) {
                $inner->where('plate', 'like', "%{$search}%")
                    ->orWhere('chasisNumber', 'like', "%{$search}%")
                    ->orWhere('engineNumber', 'like', "%{$search}%")
                    ->orWhereHas('vehicleType', function ($vehicleQuery) use ($search) {
                        $vehicleQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($vehicleTypeId !== null) {
            $query->where('vehicletype_id', $vehicleTypeId);
        }

        $status = $this->normalizeStatus($status);

        if ($status !== null) {
            $query->where('status', $status);
        }

        return $query;
    }

    private function normalizeStatus(?string $status): ?string
    {
        if ($status === null) {
            return null;
        }

        $value = strtolower(trim($status));

        if ($value === '' || $value === 'all') {
            return null;
        }

        return $value;
    }

    public function clearCache(): void
    {
        $this->localMetrics = [];
    }
}
