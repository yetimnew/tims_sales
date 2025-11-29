<?php

namespace App\Services;

use App\Models\DailyTruckStatus;
use App\Models\DriverTruck;
use App\Models\Truck;
use App\Models\TruckGradingSetting;
use App\Models\VehicleMaintenanceRecord;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class TruckGradeService
{
    public function grade(Truck $truck): array
    {
        $settings = $this->resolveSettings();

        $peerIds = $this->determinePeerTruckIds($truck, $settings['peer_sample_size']);
        $comparisonIds = $peerIds->concat([$truck->id])->unique()->values();

        $metricDataset = $this->buildMetricDataset($comparisonIds);

        return $this->buildReport(
            $truck->id,
            $metricDataset,
            $peerIds->unique()->values(),
            $settings,
        );
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Truck>  $trucks
     * @return \Illuminate\Support\Collection<int, array>
     */
    public function gradeMany(Collection $trucks): Collection
    {
        $trucks = $trucks->filter(fn ($truck) => $truck instanceof Truck);

        if ($trucks->isEmpty()) {
            return collect();
        }

        $settings = $this->resolveSettings();

        $allIds = collect();
        $peerMap = [];

        /** @var Truck $truck */
        foreach ($trucks as $truck) {
            $peerIds = $this->determinePeerTruckIds($truck, $settings['peer_sample_size']);
            $peerMap[$truck->id] = $peerIds;
            $allIds = $allIds->concat($peerIds)->push($truck->id);
        }

        $metricDataset = $this->buildMetricDataset($allIds->unique()->values());

        return $trucks->mapWithKeys(function (Truck $truck) use ($metricDataset, $peerMap, $settings) {
            $peerIds = $peerMap[$truck->id] ?? collect();

            return [
                $truck->id => $this->buildReport(
                    $truck->id,
                    $metricDataset,
                    $peerIds instanceof Collection ? $peerIds->unique()->values() : collect($peerIds)->unique()->values(),
                    $settings,
                ),
            ];
        });
    }

    private function buildReport(int $truckId, Collection $metricDataset, Collection $peerIds, array $settings): array
    {
        $peerMetrics = $peerIds->isEmpty()
            ? collect()
            : $metricDataset->only($peerIds->all());

        $targetMetrics = $metricDataset->get($truckId, []);

        $averages = $this->calculateAverages($peerMetrics);

        $categories = $this->calculateCategoryScores($targetMetrics, $averages);

        $aggregateScore = $this->calculateAggregate($categories, $settings);

        return [
            'overall' => [
                'score' => $aggregateScore,
                'letter' => $this->scoreToLetter($aggregateScore),
            ],
            'weights' => Arr::only($settings, [
                'utilization_weight',
                'efficiency_weight',
                'reliability_weight',
                'financial_weight',
                'compliance_weight',
            ]),
            'categories' => $categories,
            'metrics' => [
                'truck' => $targetMetrics,
                'peer_averages' => $averages,
            ],
        ];
    }

    private function resolveSettings(): array
    {
        $latest = TruckGradingSetting::query()->latest('created_at')->first();

        if (! $latest) {
            return TruckGradingSetting::defaultWeights();
        }

        return array_merge(
            TruckGradingSetting::defaultWeights(),
            $latest->only([
                'utilization_weight',
                'efficiency_weight',
                'reliability_weight',
                'financial_weight',
                'compliance_weight',
                'peer_sample_size',
            ]),
        );
    }

    private function determinePeerTruckIds(Truck $truck, int $sampleSize): Collection
    {
        $peerQuery = Truck::query()
            ->select('id')
            ->where('id', '!=', $truck->id)
            ->orderByDesc('created_at');

        if ($truck->vehicletype_id) {
            $peerQuery->where('vehicletype_id', $truck->vehicletype_id);
        }

        $peers = $peerQuery
            ->limit($sampleSize)
            ->pluck('id');

        if ($peers->count() > 0) {
            return $peers;
        }

        return Truck::query()
            ->select('id')
            ->where('id', '!=', $truck->id)
            ->orderByDesc('created_at')
            ->limit($sampleSize)
            ->pluck('id');
    }

    private function buildMetricDataset(Collection $truckIds): Collection
    {
        $trucks = Truck::query()
            ->whereIn('id', $truckIds)
            ->get([
                'id',
                'vehicletype_id',
                'purchasePrice',
                'productionDate',
                'serviceStartDate',
                'status',
            ])
            ->keyBy('id');

        $performance = $this->loadPerformanceMetrics($truckIds);
        $maintenance = $this->loadMaintenanceMetrics($truckIds);
        $statuses = $this->loadStatusMetrics($truckIds);

        $now = Carbon::now();

        return $truckIds->mapWithKeys(function ($id) use ($trucks, $performance, $maintenance, $statuses, $now) {
            $truck = $trucks->get($id);

            if (! $truck) {
                return [$id => []];
            }

            $performanceRow = $performance->get($id, (object) [
                'total_distance' => 0.0,
                'total_fuel' => 0.0,
                'total_fuel_cost' => 0.0,
                'performance_records' => 0,
            ]);

            $maintenanceRow = $maintenance->get($id, (object) [
                'total_records' => 0,
                'completed_records' => 0,
                'scheduled_records' => 0,
                'overdue_records' => 0,
                'total_cost' => 0.0,
                'total_cost_last_year' => 0.0,
            ]);

            $statusRow = $statuses->get($id, (object) [
                'status_changes' => 0,
                'downtime_changes' => 0,
            ]);

            $serviceStart = $truck->serviceStartDate ? Carbon::parse($truck->serviceStartDate) : null;
            $productionDate = $truck->productionDate ? Carbon::parse($truck->productionDate) : null;

            $distance = (float) $performanceRow->total_distance;
            $fuelLiters = (float) $performanceRow->total_fuel;
            $fuelCost = (float) $performanceRow->total_fuel_cost;

            $avgKmPerLiter = $fuelLiters > 0 ? round($distance / $fuelLiters, 2) : null;
            $fuelCostPerKm = $distance > 0 ? round($fuelCost / $distance, 2) : null;

            $completedRecords = (int) $maintenanceRow->completed_records;
            $scheduledRecords = (int) $maintenanceRow->scheduled_records;
            $totalRecords = (int) $maintenanceRow->total_records;
            $overdueRecords = (int) $maintenanceRow->overdue_records;
            $completionRate = $totalRecords > 0 ? round($completedRecords / $totalRecords, 4) : null;

            $daysActive = $serviceStart ? $serviceStart->diffInDays($now) : null;
            $ageYears = $productionDate ? round($productionDate->diffInYears($now) + ($productionDate->diffInMonths($now) % 12) / 12, 2) : null;

            return [$id => [
                'truck_id' => $id,
                'vehicle_type_id' => $truck->vehicletype_id,
                'status' => $truck->status,
                'total_distance_km' => round($distance, 2),
                'total_fuel_liters' => $fuelLiters > 0 ? round($fuelLiters, 2) : null,
                'total_fuel_cost' => $fuelCost > 0 ? round($fuelCost, 2) : null,
                'performance_records' => (int) $performanceRow->performance_records,
                'avg_km_per_liter' => $avgKmPerLiter,
                'fuel_cost_per_km' => $fuelCostPerKm,
                'maintenance_total_records' => $totalRecords,
                'maintenance_completed_records' => $completedRecords,
                'maintenance_scheduled_records' => $scheduledRecords,
                'maintenance_overdue_records' => $overdueRecords,
                'maintenance_completion_rate' => $completionRate,
                'maintenance_total_cost' => round((float) $maintenanceRow->total_cost, 2),
                'maintenance_total_cost_last_year' => round((float) $maintenanceRow->total_cost_last_year, 2),
                'status_changes_90d' => (int) $statusRow->status_changes,
                'downtime_changes_90d' => (int) $statusRow->downtime_changes,
                'purchase_price' => $truck->purchasePrice !== null ? (float) $truck->purchasePrice : null,
                'days_active' => $daysActive,
                'age_years' => $ageYears,
            ]];
        });
    }

    private function loadPerformanceMetrics(Collection $truckIds): Collection
    {
        return DriverTruck::query()
            ->selectRaw(
                'driver_truck.truck_id as truck_id,'.
                ' COALESCE(SUM(COALESCE(performances.DistanceWCargo, 0) + COALESCE(performances.DistanceWOCargo, 0)), 0) as total_distance,'.
                ' COALESCE(SUM(COALESCE(performances.fuelInLitter, 0)), 0) as total_fuel,'.
                ' COALESCE(SUM(COALESCE(performances.fuelInBirr, 0)), 0) as total_fuel_cost,'.
                ' COUNT(performances.id) as performance_records'
            )
            ->leftJoin('performances', function ($join) {
                $join->on('performances.driver_truck_id', '=', 'driver_truck.id')
                    ->whereNull('performances.deleted_at');
            })
            ->whereIn('driver_truck.truck_id', $truckIds)
            ->whereNull('driver_truck.deleted_at')
            ->groupBy('driver_truck.truck_id')
            ->get()
            ->keyBy('truck_id');
    }

    private function loadMaintenanceMetrics(Collection $truckIds): Collection
    {
        $now = Carbon::now();
        $oneYearAgo = $now->copy()->subYear();

        return VehicleMaintenanceRecord::query()
            ->selectRaw(
                'truck_id,'.
                ' COUNT(*) as total_records,'.
                ' SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed_records,'.
                ' SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as scheduled_records,'.
                ' SUM(CASE WHEN status = ? AND scheduled_date < ? THEN 1 ELSE 0 END) as overdue_records,'.
                ' COALESCE(SUM(COALESCE(cost, 0)), 0) as total_cost,'.
                ' COALESCE(SUM(CASE WHEN completed_date >= ? THEN COALESCE(cost, 0) ELSE 0 END), 0) as total_cost_last_year', ['completed', 'scheduled', 'scheduled', $now, $oneYearAgo])
            ->whereIn('truck_id', $truckIds)
            ->whereNull('deleted_at')
            ->groupBy('truck_id')
            ->get()
            ->keyBy('truck_id');
    }

    private function loadStatusMetrics(Collection $truckIds): Collection
    {
        $ninetyDaysAgo = Carbon::now()->subDays(90);

        return DailyTruckStatus::query()
            ->selectRaw(
                'daily_truck_statuses.truck_id,'.
                ' COUNT(*) as status_changes,'.
                ' SUM(CASE WHEN LOWER(statuses.name) IN (?, ?) THEN 1 ELSE 0 END) as downtime_changes', ['inactive', 'maintenance'])
            ->leftJoin('statuses', 'statuses.id', '=', 'daily_truck_statuses.status_id')
            ->whereIn('daily_truck_statuses.truck_id', $truckIds)
            ->whereNull('daily_truck_statuses.deleted_at')
            ->where('daily_truck_statuses.status_date', '>=', $ninetyDaysAgo)
            ->groupBy('daily_truck_statuses.truck_id')
            ->get()
            ->keyBy('truck_id');
    }

    private function calculateAverages(Collection $peerMetrics): array
    {
        if ($peerMetrics->isEmpty()) {
            return [];
        }

        $keys = [
            'total_distance_km',
            'avg_km_per_liter',
            'fuel_cost_per_km',
            'maintenance_completion_rate',
            'maintenance_overdue_records',
            'maintenance_total_cost_last_year',
            'purchase_price',
            'status_changes_90d',
            'downtime_changes_90d',
        ];

        $averages = [];

        foreach ($keys as $key) {
            $values = $peerMetrics
                ->pluck($key)
                ->filter(static fn ($value) => $value !== null && $value !== false)
                ->map(static fn ($value) => (float) $value);

            $averages[$key] = $values->isNotEmpty() ? round($values->average(), 2) : null;
        }

        return $averages;
    }

    private function calculateCategoryScores(array $target, array $averages): array
    {
        $utilizationScore = $this->scoreHigherIsBetter(
            $target['total_distance_km'] ?? null,
            $averages['total_distance_km'] ?? null
        );

        $efficiencyScore = $this->scoreHigherIsBetter(
            $target['avg_km_per_liter'] ?? null,
            $averages['avg_km_per_liter'] ?? null
        );

        $reliabilityScore = $this->scoreHigherIsBetter(
            $target['maintenance_completion_rate'] ?? null,
            $averages['maintenance_completion_rate'] ?? null
        ) - $this->penalizeOverdue((int) ($target['maintenance_overdue_records'] ?? 0));

        $financialScore = $this->scoreLowerIsBetter(
            $target['maintenance_total_cost_last_year'] ?? null,
            $averages['maintenance_total_cost_last_year'] ?? null
        );

        $complianceScore = $this->scoreLowerIsBetter(
            $target['downtime_changes_90d'] ?? null,
            $averages['downtime_changes_90d'] ?? null
        );

        return [
            'utilization' => [
                'score' => $this->clampScore($utilizationScore),
                'metrics' => [
                    'total_distance_km' => $target['total_distance_km'] ?? null,
                    'peer_average_distance_km' => $averages['total_distance_km'] ?? null,
                    'performance_records' => $target['performance_records'] ?? null,
                    'days_active' => $target['days_active'] ?? null,
                ],
            ],
            'efficiency' => [
                'score' => $this->clampScore($efficiencyScore),
                'metrics' => [
                    'km_per_liter' => $target['avg_km_per_liter'] ?? null,
                    'peer_average_km_per_liter' => $averages['avg_km_per_liter'] ?? null,
                    'fuel_cost_per_km' => $target['fuel_cost_per_km'] ?? null,
                ],
            ],
            'reliability' => [
                'score' => $this->clampScore($reliabilityScore),
                'metrics' => [
                    'completion_rate' => $target['maintenance_completion_rate'] ?? null,
                    'peer_completion_rate' => $averages['maintenance_completion_rate'] ?? null,
                    'overdue_records' => $target['maintenance_overdue_records'] ?? null,
                ],
            ],
            'financial' => [
                'score' => $this->clampScore($financialScore),
                'metrics' => [
                    'maintenance_cost_last_year' => $target['maintenance_total_cost_last_year'] ?? null,
                    'peer_cost_last_year' => $averages['maintenance_total_cost_last_year'] ?? null,
                    'purchase_price' => $target['purchase_price'] ?? null,
                ],
            ],
            'compliance' => [
                'score' => $this->clampScore($complianceScore),
                'metrics' => [
                    'downtime_changes_90d' => $target['downtime_changes_90d'] ?? null,
                    'peer_downtime_changes_90d' => $averages['downtime_changes_90d'] ?? null,
                    'status_changes_90d' => $target['status_changes_90d'] ?? null,
                ],
            ],
        ];
    }

    private function calculateAggregate(array $categories, array $settings): float
    {
        $weights = [
            'utilization' => $settings['utilization_weight'],
            'efficiency' => $settings['efficiency_weight'],
            'reliability' => $settings['reliability_weight'],
            'financial' => $settings['financial_weight'],
            'compliance' => $settings['compliance_weight'],
        ];

        $weightSum = max(array_sum($weights), 1);

        $scoreSum = 0.0;

        foreach ($categories as $key => $category) {
            $weight = $weights[$key] ?? 0;
            $score = $category['score'] ?? 0;
            $scoreSum += ($weight / $weightSum) * $score;
        }

        return round($scoreSum, 1);
    }

    private function scoreHigherIsBetter(?float $value, ?float $peerAverage): float
    {
        if ($value === null) {
            return 0.0;
        }

        if ($peerAverage === null || $peerAverage <= 0) {
            return $value > 0 ? 70.0 : 50.0;
        }

        $ratio = $value / $peerAverage;

        return 50 + $this->clampRatio(($ratio - 1) * 50);
    }

    private function scoreLowerIsBetter(?float $value, ?float $peerAverage): float
    {
        if ($value === null) {
            return 60.0;
        }

        if ($value <= 0) {
            return 95.0;
        }

        if ($peerAverage === null || $peerAverage <= 0) {
            $peerAverage = $value;
        }

        $ratio = $peerAverage / max($value, 0.0001);

        return 50 + $this->clampRatio(($ratio - 1) * 50);
    }

    private function penalizeOverdue(int $count): float
    {
        if ($count <= 0) {
            return 0.0;
        }

        return min($count * 6.5, 40.0);
    }

    private function clampRatio(float $delta): float
    {
        return max(min($delta, 50), -50);
    }

    private function clampScore(float $score): float
    {
        return round(max(min($score, 100), 0), 1);
    }

    private function scoreToLetter(float $score): string
    {
        return match (true) {
            $score >= 90 => 'A',
            $score >= 80 => 'B',
            $score >= 70 => 'C',
            $score >= 60 => 'D',
            default => 'E',
        };
    }
}
