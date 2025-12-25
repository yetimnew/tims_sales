<?php

namespace App\Services;

use App\Models\DriverTruck;
use App\Models\DriverTruckGradingSetting;
use App\Models\Performance;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class DriverTruckGradeService
{
    private ?array $resolvedSettings = null;

    public function grade(DriverTruck $assignment): array
    {
        $settings = $this->resolveSettings();

        // Check if assignment has sufficient data for grading
        $dataSufficiency = $this->assessDataSufficiency($assignment, $settings);

        if ($dataSufficiency['status'] === 'insufficient') {
            return [
                'status' => 'insufficient_data',
                'message' => $dataSufficiency['message'],
                'requirements' => $dataSufficiency['requirements'],
                'current' => $dataSufficiency['current'],
                'overall' => null,
                'categories' => null,
                'weights' => $settings['weights'],
                'grade_thresholds' => $settings['grade_thresholds'],
                'metrics' => null,
            ];
        }

        $peerIds = $this->determinePeerAssignmentIds($assignment, $settings['peer_sample_size']);
        $comparisonIds = $peerIds->concat([$assignment->id])->unique()->values();

        $metricDataset = $this->buildMetricDataset($comparisonIds);

        $report = $this->buildReport(
            $assignment->id,
            $metricDataset,
            $peerIds->unique()->values(),
            $settings['weights'],
            $settings['grade_thresholds'],
        );

        // Add status to report
        $report['status'] = 'graded';

        return $report;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, DriverTruck>  $assignments
     * @return \Illuminate\Support\Collection<int, array>
     */
    public function gradeMany(Collection $assignments): Collection
    {
        $assignments = $assignments->filter(fn ($assignment) => $assignment instanceof DriverTruck);

        if ($assignments->isEmpty()) {
            return collect();
        }

        $settings = $this->resolveSettings();

        $allIds = collect();
        $peerMap = [];

        /** @var DriverTruck $assignment */
        foreach ($assignments as $assignment) {
            $peerIds = $this->determinePeerAssignmentIds($assignment, $settings['peer_sample_size']);
            $peerMap[$assignment->id] = $peerIds;
            $allIds = $allIds->concat($peerIds)->push($assignment->id);
        }

        $metricDataset = $this->buildMetricDataset($allIds->unique()->values());

        return $assignments->mapWithKeys(function (DriverTruck $assignment) use ($metricDataset, $peerMap, $settings) {
            $peerIds = $peerMap[$assignment->id] ?? collect();

            return [
                $assignment->id => $this->buildReport(
                    $assignment->id,
                    $metricDataset,
                    $peerIds instanceof Collection ? $peerIds->unique()->values() : collect($peerIds)->unique()->values(),
                    $settings['weights'],
                    $settings['grade_thresholds'],
                ),
            ];
        });
    }

    private function resolveSettings(): array
    {
        if ($this->resolvedSettings !== null) {
            return $this->resolvedSettings;
        }

        $defaults = array_merge(
            DriverTruckGradingSetting::defaultWeights(),
            [
                'min_trips' => 2,
                'min_days_assigned' => 14,
            ]
        );
        $defaultThresholds = DriverTruckGradingSetting::defaultGradeThresholds();

        $latest = DriverTruckGradingSetting::query()->latest('updated_at')->first();

        $weights = array_merge(
            $defaults,
            $latest?->only(array_keys($defaults)) ?? [],
        );

        $thresholds = DriverTruckGradingSetting::normalizeGradeThresholds(
            $latest?->grade_thresholds ?? [],
            $defaultThresholds,
        );

        return $this->resolvedSettings = [
            'weights' => Arr::only($weights, [
                'performance_weight',
                'efficiency_weight',
                'consistency_weight',
            ]),
            'peer_sample_size' => $weights['peer_sample_size'],
            'grade_thresholds' => array_map(static fn ($value) => (float) $value, $thresholds),
            'min_trips' => $weights['min_trips'] ?? 2,
            'min_days_assigned' => $weights['min_days_assigned'] ?? 14,
        ];
    }

    private function assessDataSufficiency(DriverTruck $assignment, array $settings): array
    {
        $minTrips = $settings['min_trips'] ?? 2;
        $minDaysAssigned = $settings['min_days_assigned'] ?? 14;

        // Count trips for this assignment
        $tripCount = Performance::query()
            ->where('driver_truck_id', $assignment->id)
            ->whereNull('deleted_at')
            ->count();

        // Calculate days assigned
        $daysAssigned = 0;
        if ($assignment->date_recived) {
            $endDate = $assignment->date_detach ? Carbon::parse($assignment->date_detach) : Carbon::now();
            $daysAssigned = Carbon::parse($assignment->date_recived)->diffInDays($endDate);
        }

        $requirements = [];
        $unmetCount = 0;

        // Check trips requirement
        $tripsMet = $tripCount >= $minTrips;
        if (!$tripsMet) {
            $unmetCount++;
        }
        $requirements[] = [
            'description' => 'Minimum trips with this assignment',
            'minimum' => $minTrips,
            'current' => $tripCount,
            'met' => $tripsMet,
        ];

        // Check days assigned requirement
        $daysMet = $daysAssigned >= $minDaysAssigned;
        if (!$daysMet) {
            $unmetCount++;
        }
        $requirements[] = [
            'description' => 'Minimum days in this assignment',
            'minimum' => $minDaysAssigned,
            'current' => $daysAssigned,
            'met' => $daysMet,
        ];

        // Determine if data is sufficient (at least one requirement must be met)
        $isSufficient = $tripsMet || $daysMet;

        if (!$isSufficient) {
            $message = sprintf(
                'This assignment needs %d more trip(s) or %d more day(s) before grading can be calculated.',
                max(0, $minTrips - $tripCount),
                max(0, $minDaysAssigned - $daysAssigned)
            );

            return [
                'status' => 'insufficient',
                'message' => $message,
                'requirements' => $requirements,
                'current' => [
                    'trips' => $tripCount,
                    'days_assigned' => $daysAssigned,
                ],
            ];
        }

        return [
            'status' => 'sufficient',
            'requirements' => $requirements,
            'current' => [
                'trips' => $tripCount,
                'days_assigned' => $daysAssigned,
            ],
        ];
    }

    private function buildReport(int $assignmentId, Collection $metricDataset, Collection $peerIds, array $weights, array $gradeThresholds): array
    {
        $peerMetrics = $peerIds->isEmpty()
            ? collect()
            : $metricDataset->only($peerIds->all());

        $targetMetrics = $metricDataset->get($assignmentId, $this->emptyMetrics($assignmentId));

        $averages = $this->calculateAverages($peerMetrics);

        $categories = $this->calculateCategoryScores($targetMetrics, $averages);

        $aggregateScore = $this->calculateAggregate($categories, $weights);

        return [
            'overall' => [
                'score' => $aggregateScore,
                'letter' => $this->scoreToLetter($aggregateScore, $gradeThresholds),
            ],
            'weights' => $weights,
            'categories' => $categories,
            'metrics' => [
                'assignment' => $targetMetrics,
                'peer_averages' => $averages,
            ],
            'grade_thresholds' => $gradeThresholds,
        ];
    }

    private function determinePeerAssignmentIds(DriverTruck $assignment, int $sampleSize): Collection
    {
        $peers = DriverTruck::query()
            ->select('id')
            ->where('truck_id', $assignment->truck_id)
            ->where('id', '!=', $assignment->id)
            ->orderByDesc('date_recived')
            ->limit($sampleSize)
            ->pluck('id');

        if ($peers->count() >= $sampleSize) {
            return $peers->unique()->values();
        }

        $remaining = $sampleSize - $peers->count();

        if ($remaining > 0) {
            $driverPeers = DriverTruck::query()
                ->select('id')
                ->where('driver_id', $assignment->driver_id)
                ->where('id', '!=', $assignment->id)
                ->whereNotIn('id', $peers)
                ->orderByDesc('date_recived')
                ->limit($remaining)
                ->pluck('id');

            $peers = $peers->concat($driverPeers);
            $remaining = $sampleSize - $peers->count();
        }

        if ($remaining > 0) {
            $fallback = DriverTruck::query()
                ->select('id')
                ->where('id', '!=', $assignment->id)
                ->whereNotIn('id', $peers)
                ->orderByDesc('date_recived')
                ->limit($remaining)
                ->pluck('id');

            $peers = $peers->concat($fallback);
        }

        return $peers->unique()->values();
    }

    private function buildMetricDataset(Collection $assignmentIds): Collection
    {
        if ($assignmentIds->isEmpty()) {
            return collect();
        }

        $performances = Performance::query()
            ->whereIn('driver_truck_id', $assignmentIds)
            ->whereNull('deleted_at')
            ->get([
                'driver_truck_id',
                'DistanceWCargo',
                'DistanceWOCargo',
                'fuelInLitter',
                'fuelInBirr',
                'is_returned',
                'DateDispach',
                'returned_date',
                'tonkm',
                'CargoVolumMT',
            ])
            ->groupBy('driver_truck_id');

        return $assignmentIds->mapWithKeys(function ($assignmentId) use ($performances) {
            /** @var \Illuminate\Support\Collection<int, Performance> $records */
            $records = $performances->get($assignmentId, collect());

            if ($records->isEmpty()) {
                return [$assignmentId => $this->emptyMetrics($assignmentId)];
            }

            $totalTrips = $records->count();
            $totalDistance = $records->reduce(static function (float $carry, Performance $performance): float {
                return $carry
                    + (float) ($performance->DistanceWCargo ?? 0)
                    + (float) ($performance->DistanceWOCargo ?? 0);
            }, 0.0);

            $completedTrips = $records->filter(static fn (Performance $performance) => (bool) $performance->is_returned)->count();
            $avgTripDistance = $totalTrips > 0 ? round($totalDistance / $totalTrips, 2) : null;

            $totalTonKm = $records->reduce(static function (float $carry, Performance $performance): float {
                return $carry + (float) ($performance->tonkm ?? 0);
            }, 0.0);

            $totalCargoVolume = $records->reduce(static function (float $carry, Performance $performance): float {
                return $carry + (float) ($performance->CargoVolumMT ?? 0);
            }, 0.0);

            $avgCargoVolume = $totalTrips > 0 ? round($totalCargoVolume / $totalTrips, 2) : null;

            $totalFuelLiters = $records->reduce(static function (float $carry, Performance $performance): float {
                return $carry + (float) ($performance->fuelInLitter ?? 0);
            }, 0.0);

            $totalFuelCost = $records->reduce(static function (float $carry, Performance $performance): float {
                return $carry + (float) ($performance->fuelInBirr ?? 0);
            }, 0.0);

            $kmPerLiter = $totalFuelLiters > 0 ? round($totalDistance / max($totalFuelLiters, 0.0001), 2) : null;
            $fuelCostPerKm = $totalDistance > 0 ? round($totalFuelCost / max($totalDistance, 0.0001), 2) : null;
            $completionRate = $totalTrips > 0 ? round($completedTrips / $totalTrips, 3) : null;

            $durations = $records
                ->map(static function (Performance $performance): ?float {
                    if (! $performance->DateDispach || ! $performance->returned_date) {
                        return null;
                    }

                    $start = Carbon::parse($performance->DateDispach);
                    $end = Carbon::parse($performance->returned_date);

                    if ($end->lessThan($start)) {
                        return null;
                    }

                    return $start->diffInMinutes($end) / 1440;
                })
                ->filter(static fn ($value) => $value !== null);

            $avgTripDuration = $durations->isNotEmpty() ? round($durations->average(), 2) : null;
            $tonKmPerTrip = $totalTrips > 0 ? round($totalTonKm / $totalTrips, 2) : null;

            return [$assignmentId => [
                'driver_truck_id' => $assignmentId,
                'total_trips' => $totalTrips,
                'completed_trips' => $completedTrips,
                'trip_completion_rate' => $completionRate,
                'total_distance_km' => round($totalDistance, 2),
                'avg_trip_distance_km' => $avgTripDistance,
                'total_ton_km' => round($totalTonKm, 2),
                'ton_km_per_trip' => $tonKmPerTrip,
                'total_cargo_volume_mt' => round($totalCargoVolume, 2),
                'avg_cargo_volume_mt_per_trip' => $avgCargoVolume,
                'total_fuel_liters' => round($totalFuelLiters, 2),
                'total_fuel_cost' => round($totalFuelCost, 2),
                'km_per_liter' => $kmPerLiter,
                'fuel_cost_per_km' => $fuelCostPerKm,
                'avg_trip_duration_days' => $avgTripDuration,
            ]];
        });
    }

    private function emptyMetrics(int $assignmentId): array
    {
        return [
            'driver_truck_id' => $assignmentId,
            'total_trips' => 0,
            'completed_trips' => 0,
            'trip_completion_rate' => null,
            'total_distance_km' => 0.0,
            'avg_trip_distance_km' => null,
            'total_ton_km' => 0.0,
            'ton_km_per_trip' => null,
            'total_cargo_volume_mt' => 0.0,
            'avg_cargo_volume_mt_per_trip' => null,
            'total_fuel_liters' => 0.0,
            'total_fuel_cost' => 0.0,
            'km_per_liter' => null,
            'fuel_cost_per_km' => null,
            'avg_trip_duration_days' => null,
        ];
    }

    private function calculateAverages(Collection $peerMetrics): array
    {
        if ($peerMetrics->isEmpty()) {
            return [];
        }

        $keys = [
            'total_distance_km',
            'total_trips',
            'avg_trip_distance_km',
            'total_ton_km',
            'ton_km_per_trip',
            'km_per_liter',
            'fuel_cost_per_km',
            'trip_completion_rate',
            'avg_trip_duration_days',
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
            $this->scoreHigherIsBetter($target['total_ton_km'] ?? null, $averages['total_ton_km'] ?? null),
            $this->scoreHigherIsBetter($target['ton_km_per_trip'] ?? null, $averages['ton_km_per_trip'] ?? null),
        ]);

        $efficiencyScore = $this->averageScores([
            $this->scoreHigherIsBetter($target['km_per_liter'] ?? null, $averages['km_per_liter'] ?? null),
            $this->scoreLowerIsBetter($target['fuel_cost_per_km'] ?? null, $averages['fuel_cost_per_km'] ?? null),
            $this->scoreHigherIsBetter($target['avg_trip_distance_km'] ?? null, $averages['avg_trip_distance_km'] ?? null),
        ]);

        $consistencyScore = $this->averageScores([
            $this->scoreHigherIsBetter($target['trip_completion_rate'] ?? null, $averages['trip_completion_rate'] ?? null),
            $this->scoreLowerIsBetter($target['avg_trip_duration_days'] ?? null, $averages['avg_trip_duration_days'] ?? null),
        ]);

        return [
            'performance' => [
                'score' => $this->clampScore($performanceScore),
                'metrics' => Arr::only($target, [
                    'total_trips',
                    'total_distance_km',
                    'avg_trip_distance_km',
                    'total_ton_km',
                    'ton_km_per_trip',
                ]),
            ],
            'efficiency' => [
                'score' => $this->clampScore($efficiencyScore),
                'metrics' => Arr::only($target, [
                    'km_per_liter',
                    'fuel_cost_per_km',
                    'avg_trip_distance_km',
                ]),
            ],
            'consistency' => [
                'score' => $this->clampScore($consistencyScore),
                'metrics' => Arr::only($target, [
                    'trip_completion_rate',
                    'avg_trip_duration_days',
                ]),
            ],
        ];
    }

    private function calculateAggregate(array $categories, array $weights): float
    {
        $weightMap = [
            'performance' => $weights['performance_weight'] ?? 0,
            'efficiency' => $weights['efficiency_weight'] ?? 0,
            'consistency' => $weights['consistency_weight'] ?? 0,
        ];

        $weightSum = max(array_sum($weightMap), 1);

        $scoreSum = 0.0;

        foreach ($categories as $key => $category) {
            $weight = $weightMap[$key] ?? 0;
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
            return 55.0;
        }

        if ($peerAverage === null || $peerAverage <= 0) {
            return $value > 0 ? 70.0 : 55.0;
        }

        $ratio = $value / max($peerAverage, 0.0001);

        return 50 + $this->clampRatio(($ratio - 1) * 50);
    }

    private function scoreLowerIsBetter(?float $value, ?float $peerAverage): float
    {
        if ($value === null) {
            return 65.0;
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
        foreach (['A', 'B', 'C', 'D'] as $letter) {
            $threshold = (float) ($thresholds[$letter] ?? 0);

            if ($score >= $threshold) {
                return $letter;
            }
        }

        return 'E';
    }
}
