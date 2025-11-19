<?php

namespace App\Services;

use App\Models\Truck;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Database\Eloquent\Builder;

class TruckMetricsService
{
    private const CACHE_PREFIX = 'truck:metrics:';

    private const KEY_REGISTRY = 'truck:metrics:keys';

    private const CACHE_TTL_MINUTES = 5;

    public function __construct(private CacheRepository $cache) {}

    public function metrics(?string $search, ?int $vehicleTypeId): array
    {
        $filters = [
            'search' => $search !== null && $search !== '' ? trim($search) : null,
            'vehicle_type' => $vehicleTypeId ?: null,
        ];

        $cacheKey = $this->cacheKey($filters);

        $metrics = $this->cache->remember($cacheKey, now()->addMinutes(self::CACHE_TTL_MINUTES), function () use ($filters) {
            $query = Truck::query();
            $this->applyFilters($query, $filters['search'], $filters['vehicle_type']);

            $baseQuery = clone $query;

            $total = (clone $baseQuery)->count();
            $active = (clone $baseQuery)->where('status', 'active')->count();
            $maintenance = (clone $baseQuery)->where('status', 'maintenance')->count();
            $fleetValue = (float) (clone $baseQuery)->sum('purchasePrice');

            return [
                'total' => $total,
                'active' => $active,
                'maintenance' => $maintenance,
                'fleet_value' => $fleetValue,
            ];
        });

        $this->registerCacheKey($cacheKey);

        return $metrics;
    }

    public function applyFilters(Builder $query, ?string $search, ?int $vehicleTypeId): Builder
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

        return $query;
    }

    public function clearCache(): void
    {
        $keys = $this->cache->get(self::KEY_REGISTRY, []);

        foreach ($keys as $key) {
            $this->cache->forget($key);
        }

        $this->cache->forget(self::KEY_REGISTRY);
    }

    private function cacheKey(array $filters): string
    {
        return self::CACHE_PREFIX.md5(json_encode($filters));
    }

    private function registerCacheKey(string $cacheKey): void
    {
        $keys = $this->cache->get(self::KEY_REGISTRY, []);

        if (! in_array($cacheKey, $keys, true)) {
            $keys[] = $cacheKey;
            $this->cache->forever(self::KEY_REGISTRY, $keys);
        }
    }
}
