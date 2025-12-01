<?php

namespace App\Services;

use App\Models\Driver;
use App\Models\DriverGradingSetting;
use App\Models\DriverPerformanceRecord;
use App\Models\DriverSafetyRecord;
use App\Models\DriverTruck;
use App\Models\FuelRecord;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class DriverGradeService
{
    public function grade(Driver $driver): array
    {
        $settings = $this->resolveSettings();

        $peerIds = $this->determinePeerDriverIds($driver, $settings['peer_sample_size']);
        $comparisonIds = $peerIds->concat([$driver->id])->unique()->values();

        $metricDataset = $this->buildMetricDataset($comparisonIds);

        return $this->buildReport(
            $driver->id,
            $metricDataset,
            $peerIds->unique()->values(),
            $settings,
        );
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Driver>  $drivers
     * @return \Illuminate\Support\Collection<int, array>
     */
    public function gradeMany(Collection $drivers): Collection
    {
        $drivers = $drivers->filter(fn ($driver) => $driver instanceof Driver);

        if ($drivers->isEmpty()) {
            return collect();
        }

        $settings = $this->resolveSettings();

        $allIds = collect();
        $peerMap = [];

        /** @var Driver $driver */
        foreach ($drivers as $driver) {
            $peerIds = $this->determinePeerDriverIds($driver, $settings['peer_sample_size']);
            $peerMap[$driver->id] = $peerIds;
            $allIds = $allIds->concat($peerIds)->push($driver->id);
        }

        $metricDataset = $this->buildMetricDataset($allIds->unique()->values());

        return $drivers->mapWithKeys(function (Driver $driver) use ($metricDataset, $peerMap, $settings) {
            $peerIds = $peerMap[$driver->id] ?? collect();

            return [
                $driver->id => $this->buildReport(
                    $driver->id,
                    $metricDataset,
                    $peerIds instanceof Collection ? $peerIds->unique()->values() : collect($peerIds)->unique()->values(),
                    $settings,
                ),
            ];
        });
    }

    private function buildReport(int $driverId, Collection $metricDataset, Collection $peerIds, array $settings): array
    {
        $peerMetrics = $peerIds->isEmpty()
            ? collect()
            : $metricDataset->only($peerIds->all());

        $targetMetrics = $metricDataset->get($driverId, []);

        $averages = $this->calculateAverages($peerMetrics);

        $categories = $this->calculateCategoryScores($targetMetrics, $averages);

        $aggregateScore = $this->calculateAggregate($categories, $settings);

        return [
            'overall' => [
                'score' => $aggregateScore,
                'letter' => $this->scoreToLetter($aggregateScore, $settings['grade_thresholds']),
            ],
            'weights' => Arr::only($settings, [
                'performance_weight',
                'efficiency_weight',
                'safety_weight',
                'compliance_weight',
                'engagement_weight',
            ]),
            'grade_thresholds' => $settings['grade_thresholds'],
            'categories' => $categories,
            'metrics' => [
                'driver' => $targetMetrics,
                'peer_averages' => $averages,
            ],
        ];
    }

    private function resolveSettings(): array
    {
        $latest = DriverGradingSetting::query()->latest('created_at')->first();

        $defaults = array_merge(
            DriverGradingSetting::defaultWeights(),
            ['grade_thresholds' => DriverGradingSetting::defaultGradeThresholds()],
        );

        if (! $latest) {
            return $defaults;
        }

        $settings = array_merge(
            $defaults,
            array_filter($latest->only([
                'performance_weight',
                'efficiency_weight',
                'safety_weight',
                'compliance_weight',
                'engagement_weight',
                'peer_sample_size',
            ]), static fn ($value) => $value !== null),
        );

        $settings['grade_thresholds'] = DriverGradingSetting::normalizeGradeThresholds(
            $latest->grade_thresholds,
            $defaults['grade_thresholds'],
        );

        return $settings;
    }

    private function determinePeerDriverIds(Driver $driver, int $sampleSize): Collection
    {
        $peerQuery = Driver::query()
            ->select('id')
            ->where('id', '!=', $driver->id)
            ->whereNull('deleted_at')
            ->orderByDesc('hireddate')
            ->orderByDesc('created_at');

        if ($driver->status) {
            $peerQuery->where('status', $driver->status);
        }

        $peers = $peerQuery
            ->limit($sampleSize)
            ->pluck('id');

        if ($peers->count() > 0) {
            return $peers;
        }

        return Driver::query()
            ->select('id')
            ->where('id', '!=', $driver->id)
            ->whereNull('deleted_at')
            ->orderByDesc('created_at')
            ->limit($sampleSize)
            ->pluck('id');
    }

    private function buildMetricDataset(Collection $driverIds): Collection
    {
        $drivers = Driver::query()
            ->whereIn('id', $driverIds)
            ->whereNull('deleted_at')
            ->get([
                'id',
                'status',
                'hireddate',
            ])
            ->keyBy('id');

        $performance = $this->loadPerformanceMetrics($driverIds);
        $safety = $this->loadSafetyMetrics($driverIds);
        $assignments = $this->loadAssignmentMetrics($driverIds);
        $fuel = $this->loadFuelMetrics($driverIds);

        $now = Carbon::now();

        return $driverIds->mapWithKeys(function ($id) use ($drivers, $performance, $safety, $assignments, $fuel, $now) {
            $driver = $drivers->get($id);

            if (! $driver) {
                return [$id => []];
            }

            $performanceRow = $performance->get($id, (object) [
                'total_trips' => 0,
                'total_distance_km' => 0.0,
                'total_cargo_tonnage' => 0.0,
                'avg_fuel_efficiency' => null,
                'avg_customer_rating' => null,
                'safety_violations_total' => 0,
                'accidents_total' => 0,
                'records_count' => 0,
            ]);

            $safetyRow = $safety->get($id, (object) [
                'total_incidents' => 0,
                'accident_count' => 0,
                'violation_count' => 0,
                'warning_count' => 0,
                'damage_cost' => 0.0,
                'incident_weight_sum' => 0.0,
                'severity_weight_sum' => 0.0,
            ]);

            $assignmentRow = $assignments->get($id, (object) [
                'total_assignments' => 0,
                'active_assignments' => 0,
                'avg_assignment_duration_days' => null,
            ]);

            $fuelRow = $fuel->get($id, (object) [
                'total_fuel_liters' => 0.0,
                'total_fuel_cost' => 0.0,
            ]);

            $totalTrips = (int) ($performanceRow->total_trips ?? 0);
            $totalDistance = (float) ($performanceRow->total_distance_km ?? 0.0);
            $totalCargo = (float) ($performanceRow->total_cargo_tonnage ?? 0.0);
            $avgFuelEfficiency = $performanceRow->avg_fuel_efficiency !== null
                ? round((float) $performanceRow->avg_fuel_efficiency, 2)
                : null;
            $avgCustomerRating = $performanceRow->avg_customer_rating !== null
                ? round((float) $performanceRow->avg_customer_rating, 2)
                : null;
            $performanceRecords = (int) ($performanceRow->records_count ?? 0);

            $totalFuelCost = (float) ($fuelRow->total_fuel_cost ?? 0.0);
            $fuelCostPerKm = $totalDistance > 0 ? round($totalFuelCost / $totalDistance, 2) : null;

            $totalAssignments = (int) ($assignmentRow->total_assignments ?? 0);
            $activeAssignments = (int) ($assignmentRow->active_assignments ?? 0);
            $avgAssignmentDuration = $assignmentRow->avg_assignment_duration_days !== null
                ? round((float) $assignmentRow->avg_assignment_duration_days, 1)
                : null;
            $activeAssignmentRatio = $totalAssignments > 0
                ? round($activeAssignments / max($totalAssignments, 1), 3)
                : null;

            $hireDate = $driver->hireddate ? Carbon::parse($driver->hireddate) : null;
            $daysEmployed = $hireDate ? $hireDate->diffInDays($now) : null;

            $riskScore = (float) ($safetyRow->incident_weight_sum ?? 0) + (float) ($safetyRow->severity_weight_sum ?? 0);

            return [$id => [
                'driver_id' => $id,
                'status' => $driver->status,
                'total_trips' => $totalTrips,
                'total_distance_km' => round($totalDistance, 2),
                'total_cargo_tonnage' => round($totalCargo, 2),
                'avg_fuel_efficiency' => $avgFuelEfficiency,
                'avg_customer_rating' => $avgCustomerRating,
                'fuel_cost_per_km' => $fuelCostPerKm,
                'performance_records' => $performanceRecords,
                'performance_safety_violations' => (int) ($performanceRow->safety_violations_total ?? 0),
                'performance_accidents' => (int) ($performanceRow->accidents_total ?? 0),
                'safety_incidents' => (int) ($safetyRow->total_incidents ?? 0),
                'accidents' => (int) ($safetyRow->accident_count ?? 0),
                'violations' => (int) ($safetyRow->violation_count ?? 0),
                'warnings' => (int) ($safetyRow->warning_count ?? 0),
                'safety_damage_cost' => round((float) ($safetyRow->damage_cost ?? 0.0), 2),
                'safety_risk_score' => round($riskScore, 2),
                'total_fuel_cost' => round($totalFuelCost, 2),
                'total_fuel_liters' => round((float) ($fuelRow->total_fuel_liters ?? 0.0), 2),
                'total_assignments' => $totalAssignments,
                'active_assignments' => $activeAssignments,
                'avg_assignment_duration_days' => $avgAssignmentDuration,
                'active_assignment_ratio' => $activeAssignmentRatio,
                'days_employed' => $daysEmployed,
            ]];
        });
    }

    private function loadPerformanceMetrics(Collection $driverIds): Collection
    {
        return DriverPerformanceRecord::query()
            ->selectRaw(
                'driver_id,'.
                ' COALESCE(SUM(total_trips), 0) as total_trips,'.
                ' COALESCE(SUM(total_distance_km), 0) as total_distance_km,'.
                ' COALESCE(SUM(total_cargo_tonnage), 0) as total_cargo_tonnage,'.
                ' AVG(NULLIF(fuel_efficiency, 0)) as avg_fuel_efficiency,'.
                ' AVG(NULLIF(customer_rating, 0)) as avg_customer_rating,'.
                ' COALESCE(SUM(safety_violations), 0) as safety_violations_total,'.
                ' COALESCE(SUM(accidents), 0) as accidents_total,'.
                ' COUNT(*) as records_count'
            )
            ->whereIn('driver_id', $driverIds)
            ->groupBy('driver_id')
            ->get()
            ->keyBy('driver_id');
    }

    private function loadSafetyMetrics(Collection $driverIds): Collection
    {
        return DriverSafetyRecord::query()
            ->selectRaw(
                'driver_id,'.
                ' COUNT(*) as total_incidents,'.
                " SUM(CASE WHEN LOWER(incident_type) = 'accident' THEN 1 ELSE 0 END) as accident_count,".
                " SUM(CASE WHEN LOWER(incident_type) = 'violation' THEN 1 ELSE 0 END) as violation_count,".
                " SUM(CASE WHEN LOWER(incident_type) = 'warning' THEN 1 ELSE 0 END) as warning_count,".
                ' COALESCE(SUM(COALESCE(damage_cost, 0)), 0) as damage_cost,'.
                ' SUM(CASE'.
                    " WHEN LOWER(incident_type) = 'accident' THEN 5".
                    " WHEN LOWER(incident_type) = 'violation' THEN 3".
                    " WHEN LOWER(incident_type) = 'warning' THEN 1".
                    " WHEN LOWER(incident_type) = 'near_miss' THEN 2".
                    " WHEN LOWER(incident_type) = 'equipment_failure' THEN 3".
                    ' ELSE 2 END) as incident_weight_sum,'.
                ' SUM(CASE'.
                    " WHEN LOWER(severity) IN ('critical', 'severe') THEN 5".
                    " WHEN LOWER(severity) IN ('high', 'major') THEN 4".
                    " WHEN LOWER(severity) IN ('medium') THEN 3".
                    " WHEN LOWER(severity) IN ('low', 'minor') THEN 2".
                    ' ELSE 1 END) as severity_weight_sum'
            )
            ->whereIn('driver_id', $driverIds)
            ->whereNull('deleted_at')
            ->groupBy('driver_id')
            ->get()
            ->keyBy('driver_id');
    }

    private function loadAssignmentMetrics(Collection $driverIds): Collection
    {
        $now = Carbon::now();

        $assignments = DriverTruck::query()
            ->whereIn('driver_id', $driverIds)
            ->whereNull('deleted_at')
            ->get([
                'driver_id',
                'is_attached',
                'date_recived',
                'date_detach',
            ])
            ->groupBy('driver_id');

        return $assignments->map(function (Collection $items) use ($now) {
            $total = $items->count();
            $active = $items->filter(static fn ($assignment) => (bool) $assignment->is_attached)->count();

            $durations = $items
                ->filter(static fn ($assignment) => $assignment->date_recived !== null)
                ->map(static function ($assignment) use ($now) {
                    $start = Carbon::parse($assignment->date_recived);
                    $end = $assignment->date_detach ? Carbon::parse($assignment->date_detach) : $now;

                    return $start->diffInDays($end);
                })
                ->filter(static fn ($days) => $days !== null);

            $avgDuration = $durations->isNotEmpty() ? $durations->average() : null;

            return (object) [
                'total_assignments' => $total,
                'active_assignments' => $active,
                'avg_assignment_duration_days' => $avgDuration,
            ];
        });
    }

    private function loadFuelMetrics(Collection $driverIds): Collection
    {
        return FuelRecord::query()
            ->selectRaw(
                'driver_id,'.
                ' COALESCE(SUM(COALESCE(fuel_quantity_liters, 0)), 0) as total_fuel_liters,'.
                ' COALESCE(SUM(COALESCE(total_cost, 0)), 0) as total_fuel_cost'
            )
            ->whereIn('driver_id', $driverIds)
            ->whereNull('deleted_at')
            ->groupBy('driver_id')
            ->get()
            ->keyBy('driver_id');
    }

    private function calculateAverages(Collection $peerMetrics): array
    {
        if ($peerMetrics->isEmpty()) {
            return [];
        }

        $keys = [
            'total_distance_km',
            'total_trips',
            'total_cargo_tonnage',
            'avg_fuel_efficiency',
            'avg_customer_rating',
            'fuel_cost_per_km',
            'safety_incidents',
            'accidents',
            'violations',
            'warnings',
            'safety_damage_cost',
            'safety_risk_score',
            'performance_safety_violations',
            'performance_accidents',
            'avg_assignment_duration_days',
            'active_assignment_ratio',
            'days_employed',
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
        $performanceScore = $this->averageScores([
            $this->scoreHigherIsBetter($target['total_distance_km'] ?? null, $averages['total_distance_km'] ?? null),
            $this->scoreHigherIsBetter($target['total_trips'] ?? null, $averages['total_trips'] ?? null),
            $this->scoreHigherIsBetter($target['total_cargo_tonnage'] ?? null, $averages['total_cargo_tonnage'] ?? null),
        ]);

        $efficiencyScore = $this->averageScores([
            $this->scoreHigherIsBetter($target['avg_fuel_efficiency'] ?? null, $averages['avg_fuel_efficiency'] ?? null),
            $this->scoreHigherIsBetter($target['avg_customer_rating'] ?? null, $averages['avg_customer_rating'] ?? null),
            $this->scoreLowerIsBetter($target['fuel_cost_per_km'] ?? null, $averages['fuel_cost_per_km'] ?? null),
        ]);

        $safetyScore = $this->averageScores([
            $this->scoreLowerIsBetter($target['accidents'] ?? null, $averages['accidents'] ?? null),
            $this->scoreLowerIsBetter($target['safety_incidents'] ?? null, $averages['safety_incidents'] ?? null),
            $this->scoreLowerIsBetter($target['safety_damage_cost'] ?? null, $averages['safety_damage_cost'] ?? null),
            $this->scoreLowerIsBetter($target['safety_risk_score'] ?? null, $averages['safety_risk_score'] ?? null),
        ]);

        $complianceScore = $this->averageScores([
            $this->scoreLowerIsBetter($target['violations'] ?? null, $averages['violations'] ?? null),
            $this->scoreLowerIsBetter($target['warnings'] ?? null, $averages['warnings'] ?? null),
            $this->scoreLowerIsBetter($target['performance_safety_violations'] ?? null, $averages['performance_safety_violations'] ?? null),
        ]);

        $engagementScore = $this->averageScores([
            $this->scoreHigherIsBetter($target['active_assignment_ratio'] ?? null, $averages['active_assignment_ratio'] ?? null),
            $this->scoreHigherIsBetter($target['avg_assignment_duration_days'] ?? null, $averages['avg_assignment_duration_days'] ?? null),
            $this->scoreHigherIsBetter($target['days_employed'] ?? null, $averages['days_employed'] ?? null),
        ]);

        return [
            'performance' => [
                'score' => $this->clampScore($performanceScore),
                'metrics' => [
                    'total_distance_km' => $target['total_distance_km'] ?? null,
                    'total_trips' => $target['total_trips'] ?? null,
                    'total_cargo_tonnage' => $target['total_cargo_tonnage'] ?? null,
                    'performance_records' => $target['performance_records'] ?? null,
                ],
            ],
            'efficiency' => [
                'score' => $this->clampScore($efficiencyScore),
                'metrics' => [
                    'avg_fuel_efficiency' => $target['avg_fuel_efficiency'] ?? null,
                    'avg_customer_rating' => $target['avg_customer_rating'] ?? null,
                    'fuel_cost_per_km' => $target['fuel_cost_per_km'] ?? null,
                ],
            ],
            'safety' => [
                'score' => $this->clampScore($safetyScore),
                'metrics' => [
                    'safety_incidents' => $target['safety_incidents'] ?? null,
                    'accidents' => $target['accidents'] ?? null,
                    'safety_damage_cost' => $target['safety_damage_cost'] ?? null,
                    'safety_risk_score' => $target['safety_risk_score'] ?? null,
                ],
            ],
            'compliance' => [
                'score' => $this->clampScore($complianceScore),
                'metrics' => [
                    'violations' => $target['violations'] ?? null,
                    'warnings' => $target['warnings'] ?? null,
                    'recorded_violations' => $target['performance_safety_violations'] ?? null,
                ],
            ],
            'engagement' => [
                'score' => $this->clampScore($engagementScore),
                'metrics' => [
                    'active_assignments' => $target['active_assignments'] ?? null,
                    'total_assignments' => $target['total_assignments'] ?? null,
                    'avg_assignment_duration_days' => $target['avg_assignment_duration_days'] ?? null,
                    'active_assignment_ratio' => $target['active_assignment_ratio'] ?? null,
                    'days_employed' => $target['days_employed'] ?? null,
                ],
            ],
        ];
    }

    private function calculateAggregate(array $categories, array $settings): float
    {
        $weights = [
            'performance' => $settings['performance_weight'],
            'efficiency' => $settings['efficiency_weight'],
            'safety' => $settings['safety_weight'],
            'compliance' => $settings['compliance_weight'],
            'engagement' => $settings['engagement_weight'],
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

    /**
     * @param  array<int, float|null>  $scores
     */
    private function averageScores(array $scores): float
    {
        $filtered = collect($scores)
            ->filter(static fn ($score) => $score !== null)
            ->values();

        if ($filtered->isEmpty()) {
            return 60.0;
        }

        return round($filtered->average(), 1);
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

    private function clampRatio(float $delta): float
    {
        return max(min($delta, 50), -50);
    }

    private function clampScore(float $score): float
    {
        return round(max(min($score, 100), 0), 1);
    }

    private function scoreToLetter(float $score, array $thresholds): string
    {
        foreach ($thresholds as $letter => $minimum) {
            if ($score >= $minimum) {
                return $letter;
            }
        }

        return 'E';
    }
}
