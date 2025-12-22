<?php

namespace App\Services;

use App\Models\DailyTruckStatus;
use App\Models\DriverTruck;
use App\Models\Truck;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class TruckMetricsService
{
    private const UTILIZATION_LOOKBACK_DAYS = 30;

    private const STAFFING_LOOKBACK_DAYS = 180;

    private const SHORT_TENURE_THRESHOLD_DAYS = 45;

    private const MIN_ASSIGNMENTS_FOR_CHURN_FLAG = 2;

    private const IDLE_STATUS_NAMES = [
        'inactive',
        'maintenance',
        'out_of_service',
        'downtime',
    ];

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

        $filteredTruckIds = (clone $query)->pluck('id');

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
            'utilization' => $this->calculateUtilizationSnapshot($filteredTruckIds),
            'staffing' => $this->calculateStaffingSnapshot($filteredTruckIds),
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

    public function utilizationForTruck(Truck|int $truck): array
    {
        $truckId = $truck instanceof Truck ? $truck->id : $truck;

        if (! $truckId) {
            return $this->calculateUtilizationSnapshot(collect());
        }

        return $this->calculateUtilizationSnapshot(collect([$truckId]));
    }

    public function staffingForTruck(Truck|int $truck): array
    {
        $truckId = $truck instanceof Truck ? $truck->id : $truck;

        if (! $truckId) {
            return $this->calculateStaffingSnapshot(collect());
        }

        return $this->calculateStaffingSnapshot(collect([$truckId]));
    }

    public function financialForTruck(Truck|int $truck): array
    {
        return [
            'window_days' => self::UTILIZATION_LOOKBACK_DAYS,
            'total_revenue' => 0.0,
            'total_cost' => 0.0,
            'total_profit' => 0.0,
            'avg_revenue_per_truck' => 0.0,
            'ton_km' => 0.0,
            'ton_km_per_birr' => null,
        ];
    }

    private function calculateUtilizationSnapshot(Collection $truckIds): array
    {
        $windowDays = self::UTILIZATION_LOOKBACK_DAYS;

        $default = [
            'window_days' => $windowDays,
            'service_days' => 0,
            'idle_days' => 0,
            'unknown_days' => 0,
            'total_days' => 0,
            'utilization_rate' => null,
            'idle_rate' => null,
        ];

        if ($truckIds->isEmpty()) {
            return $default;
        }

        $endDate = Carbon::today();
        $startDate = $endDate->copy()->subDays($windowDays - 1);

        $latestStatusesSubquery = DailyTruckStatus::query()
            ->selectRaw('MAX(id) as id')
            ->whereIn('truck_id', $truckIds)
            ->whereBetween('status_date', [$startDate, $endDate])
            ->whereNull('deleted_at')
            ->groupBy('truck_id', 'status_date');

        $idlePlaceholders = implode(', ', array_fill(0, count(self::IDLE_STATUS_NAMES), '?'));

        $aggregates = DailyTruckStatus::query()
            ->joinSub($latestStatusesSubquery, 'latest_statuses', function ($join) {
                $join->on('daily_truck_statuses.id', '=', 'latest_statuses.id');
            })
            ->join('statuses', 'statuses.id', '=', 'daily_truck_statuses.status_id')
            ->whereNull('daily_truck_statuses.deleted_at')
            ->selectRaw(
                sprintf(
                    'SUM(CASE WHEN LOWER(statuses.name) IN (%s) THEN 1 ELSE 0 END) as idle_days',
                    $idlePlaceholders
                ),
                self::IDLE_STATUS_NAMES
            )
            ->selectRaw('COUNT(*) as total_days')
            ->first();

        $totalDays = (int) ($aggregates?->total_days ?? 0);

        if ($totalDays === 0) {
            return $this->fallbackUtilizationFromTrucks($truckIds, $windowDays);
        }

        $idleDays = (int) ($aggregates?->idle_days ?? 0);
        $serviceDays = max($totalDays - $idleDays, 0);

        $expectedDays = $truckIds->count() * $windowDays;
        $unknownDays = max($expectedDays - $totalDays, 0);

        return [
            'window_days' => $windowDays,
            'service_days' => $serviceDays,
            'idle_days' => $idleDays,
            'unknown_days' => $unknownDays,
            'total_days' => $totalDays,
            'utilization_rate' => $totalDays > 0 ? round($serviceDays / $totalDays, 4) : null,
            'idle_rate' => $totalDays > 0 ? round($idleDays / $totalDays, 4) : null,
        ];
    }

    private function fallbackUtilizationFromTrucks(Collection $truckIds, int $windowDays): array
    {
        $trucks = Truck::query()
            ->whereIn('id', $truckIds)
            ->select(['id', 'status'])
            ->get();

        if ($trucks->isEmpty()) {
            return [
                'window_days' => $windowDays,
                'service_days' => 0,
                'idle_days' => 0,
                'unknown_days' => 0,
                'total_days' => 0,
                'utilization_rate' => null,
                'idle_rate' => null,
            ];
        }

        $idleCount = $trucks->filter(function ($truck) {
            $status = strtolower((string) ($truck->status ?? ''));

            return in_array($status, self::IDLE_STATUS_NAMES, true);
        })->count();

        $serviceCount = $trucks->count() - $idleCount;

        $idleDays = $idleCount * $windowDays;
        $serviceDays = $serviceCount * $windowDays;
        $totalDays = $trucks->count() * $windowDays;

        return [
            'window_days' => $windowDays,
            'service_days' => $serviceDays,
            'idle_days' => $idleDays,
            'unknown_days' => 0,
            'total_days' => $totalDays,
            'utilization_rate' => $totalDays > 0 ? round($serviceDays / $totalDays, 4) : null,
            'idle_rate' => $totalDays > 0 ? round($idleDays / $totalDays, 4) : null,
        ];
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

    private function calculateStaffingSnapshot(Collection $truckIds): array
    {
        $windowDays = self::STAFFING_LOOKBACK_DAYS;

        $default = [
            'window_days' => $windowDays,
            'average_tenure_days' => null,
            'assignment_count' => 0,
            'truck_count_with_assignments' => 0,
            'short_tenure_threshold_days' => self::SHORT_TENURE_THRESHOLD_DAYS,
            'high_churn_truck_count' => 0,
            'high_churn_trucks' => [],
            'flagged_truck_ids' => [],
        ];

        if ($truckIds->isEmpty()) {
            return $default;
        }

        $endDate = Carbon::today();
        $startDate = $endDate->copy()->subDays($windowDays - 1);

        $assignments = DriverTruck::query()
            ->whereIn('truck_id', $truckIds)
            ->where(function ($query) use ($startDate) {
                $query->whereNull('date_detach')
                    ->orWhereDate('date_detach', '>=', $startDate);
            })
            ->where(function ($query) use ($endDate) {
                $query->whereDate('date_recived', '<=', $endDate)
                    ->orWhereDate('assigned_date', '<=', $endDate);
            })
            ->select([
                'truck_id',
                'date_recived',
                'assigned_date',
                'date_detach',
                'unassigned_date',
            ])
            ->orderBy('truck_id')
            ->get();

        if ($assignments->isEmpty()) {
            return $default;
        }

        $assignmentCount = 0;
        $totalTenureDays = 0.0;
        $perTruckStats = [];

        foreach ($assignments as $assignment) {
            $startRaw = $assignment->date_recived ?? $assignment->assigned_date;

            if (! $startRaw) {
                continue;
            }

            $start = $startRaw instanceof Carbon ? $startRaw->copy() : Carbon::parse($startRaw);
            $endRaw = $assignment->date_detach ?? $assignment->unassigned_date;
            $end = $endRaw
                ? ($endRaw instanceof Carbon ? $endRaw->copy() : Carbon::parse($endRaw))
                : $endDate->copy();

            if ($end->lt($startDate) || $start->gt($endDate)) {
                continue;
            }

            if ($start->lt($startDate)) {
                $start = $startDate->copy();
            }

            if ($end->gt($endDate)) {
                $end = $endDate->copy();
            }

            if ($end->lt($start)) {
                continue;
            }

            $tenureDays = $start->diffInDays($end) + 1;

            $assignmentCount++;
            $totalTenureDays += $tenureDays;

            $truckId = (int) $assignment->truck_id;

            if (! array_key_exists($truckId, $perTruckStats)) {
                $perTruckStats[$truckId] = [
                    'tenure_days_sum' => 0.0,
                    'assignment_count' => 0,
                ];
            }

            $perTruckStats[$truckId]['tenure_days_sum'] += $tenureDays;
            $perTruckStats[$truckId]['assignment_count']++;
        }

        if ($assignmentCount === 0) {
            return $default;
        }

        $averageTenureDays = round($totalTenureDays / $assignmentCount, 1);

        $highChurnTrucks = collect($perTruckStats)
            ->map(function (array $stat, int|string $truckId) {
                if ($stat['assignment_count'] === 0) {
                    return null;
                }

                return [
                    'truck_id' => (int) $truckId,
                    'average_tenure_days' => $stat['tenure_days_sum'] / $stat['assignment_count'],
                    'assignment_count' => (int) $stat['assignment_count'],
                ];
            })
            ->filter()
            ->filter(fn (array $stat) => $stat['assignment_count'] >= self::MIN_ASSIGNMENTS_FOR_CHURN_FLAG
                && $stat['average_tenure_days'] < self::SHORT_TENURE_THRESHOLD_DAYS)
            ->sortBy('average_tenure_days')
            ->values();

        $highChurnTruckCount = $highChurnTrucks->count();

        $flaggedTruckIds = $highChurnTrucks->pluck('truck_id')->all();

        $plateLookup = [];

        if (! empty($flaggedTruckIds)) {
            $plateLookup = Truck::query()
                ->whereIn('id', $flaggedTruckIds)
                ->pluck('plate', 'id')
                ->mapWithKeys(fn ($plate, $id) => [(int) $id => $plate])
                ->all();
        }

        $highChurnTrucksLimited = $highChurnTrucks
            ->map(function (array $stat) use ($plateLookup) {
                $truckId = $stat['truck_id'];

                return [
                    'truck_id' => $truckId,
                    'truck_plate' => $plateLookup[$truckId] ?? null,
                    'average_tenure_days' => round($stat['average_tenure_days'], 1),
                    'assignment_count' => $stat['assignment_count'],
                ];
            })
            ->take(10)
            ->all();

        return [
            'window_days' => $windowDays,
            'average_tenure_days' => $averageTenureDays,
            'assignment_count' => $assignmentCount,
            'truck_count_with_assignments' => count($perTruckStats),
            'short_tenure_threshold_days' => self::SHORT_TENURE_THRESHOLD_DAYS,
            'high_churn_truck_count' => $highChurnTruckCount,
            'high_churn_trucks' => $highChurnTrucksLimited,
            'flagged_truck_ids' => array_map('intval', $flaggedTruckIds),
        ];
    }
}
