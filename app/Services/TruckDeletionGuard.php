<?php

namespace App\Services;

use App\Models\Truck;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

class TruckDeletionGuard
{
    private const CACHE_TTL_SECONDS = 30;

    public function __construct(private CacheRepository $cache) {}

    /**
     * Determine which related records prevent the truck from being deleted.
     *
     * @return array<int, string>
     */
    public function blockers(Truck $truck): array
    {
        $counts = $this->relationshipCounts($truck);

        $messages = [];

        if ($counts['performances'] > 0) {
            $messages[] = 'You are not allowed to delete this truck. It has '.$counts['performances'].' performance record(s). Please remove all performance records first.';
        }

        if ($counts['maintenance_records'] > 0) {
            $messages[] = 'You are not allowed to delete this truck. It has '.$counts['maintenance_records'].' maintenance record(s). Please remove all maintenance records first.';
        }

        if ($counts['fuel_records'] > 0) {
            $messages[] = 'You are not allowed to delete this truck. It has '.$counts['fuel_records'].' fuel record(s). Please remove all fuel records first.';
        }

        if ($counts['fuel_consumption_analysis'] > 0) {
            $messages[] = 'You are not allowed to delete this truck. It has '.$counts['fuel_consumption_analysis'].' fuel consumption analysis record(s). Please remove all fuel consumption analysis records first.';
        }

        if ($counts['financial_records'] > 0) {
            $messages[] = 'You are not allowed to delete this truck. It has '.$counts['financial_records'].' financial record(s). Please remove all financial records first.';
        }

        if ($counts['insurance_records'] > 0) {
            $messages[] = 'You are not allowed to delete this truck. It has '.$counts['insurance_records'].' insurance record(s). Please remove all insurance records first.';
        }

        if ($counts['route_plans'] > 0) {
            $messages[] = 'You are not allowed to delete this truck. It has '.$counts['route_plans'].' route plan(s). Please remove all route plans first.';
        }

        if ($counts['daily_statuses'] > 0) {
            $messages[] = 'You are not allowed to delete this truck. It has '.$counts['daily_statuses'].' daily status record(s). Please remove all daily status records first.';
        }

        if ($counts['active_drivers'] > 0) {
            $messages[] = 'You are not allowed to delete this truck. It is currently assigned to '.$counts['active_drivers'].' active driver(s). Please unassign all drivers first.';
        }

        return $messages;
    }

    public function clearCache(Truck $truck): void
    {
        $this->cache->forget($this->cacheKey($truck));
    }

    /**
     * @return array<string, int>
     */
    private function relationshipCounts(Truck $truck): array
    {
        $cacheKey = $this->cacheKey($truck);

        return $this->cache->remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($truck) {
            $truck->loadCount([
                'performances',
                'maintenanceRecords',
                'fuelRecords',
                'fuelConsumptionAnalysis',
                'financialRecords',
                'insuranceRecords',
                'routePlans',
                'dailyStatuses',
                'drivers as active_drivers_count' => fn ($query) => $query
                    ->where('driver_truck.status', 'active')
                    ->whereNull('driver_truck.deleted_at'),
            ]);

            return [
                'performances' => (int) $truck->performances_count,
                'maintenance_records' => (int) $truck->maintenance_records_count,
                'fuel_records' => (int) $truck->fuel_records_count,
                'fuel_consumption_analysis' => (int) $truck->fuel_consumption_analysis_count,
                'financial_records' => (int) $truck->financial_records_count,
                'insurance_records' => (int) $truck->insurance_records_count,
                'route_plans' => (int) $truck->route_plans_count,
                'daily_statuses' => (int) $truck->daily_statuses_count,
                'active_drivers' => (int) $truck->active_drivers_count,
            ];
        });
    }

    private function cacheKey(Truck $truck): string
    {
        return 'truck:'.$truck->id.':deletion-blockers';
    }
}
