<?php

namespace App\Services;

use App\Models\DriverTruck;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

class DriverTruckDeletionGuard
{
    private const CACHE_TTL_SECONDS = 30;

    public function __construct(private CacheRepository $cache) {}

    /**
     * Determine which related records prevent the assignment from being deleted.
     *
     * @return array<int, string>
     */
    public function blockers(DriverTruck $assignment): array
    {
        $counts = $this->relationshipCounts($assignment);

        $messages = [];

        if ($counts['performances'] > 0) {
            $messages[] = 'You are not allowed to delete this assignment. It has '.$counts['performances'].' performance record(s). Please remove all performance records first.';
        }

        if ($counts['fuel_records'] > 0) {
            $messages[] = 'You are not allowed to delete this assignment. It has '.$counts['fuel_records'].' fuel record(s). Please remove all fuel records first.';
        }

        return $messages;
    }

    public function clearCache(DriverTruck $assignment): void
    {
        $this->cache->forget($this->cacheKey($assignment));
    }

    /**
     * @return array<string, int>
     */
    private function relationshipCounts(DriverTruck $assignment): array
    {
        $cacheKey = $this->cacheKey($assignment);

        return $this->cache->remember($cacheKey, self::CACHE_TTL_SECONDS, static function () use ($assignment) {
            $assignment->loadCount([
                'performances',
                'fuelRecords',
            ]);

            return [
                'performances' => (int) $assignment->performances_count,
                'fuel_records' => (int) $assignment->fuel_records_count,
            ];
        });
    }

    private function cacheKey(DriverTruck $assignment): string
    {
        return 'driver-truck:'.$assignment->id.':deletion-blockers';
    }
}
