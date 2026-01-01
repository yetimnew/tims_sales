<?php

namespace App\Services\Reports;

use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Truck;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CapacityPlanningReport
{
    /**
     * Build comprehensive capacity planning and fleet optimization analysis.
     */
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);

        $fleetOverview = $this->calculateFleetOverview($from, $to);
        $utilizationAnalysis = $this->calculateUtilizationAnalysis($from, $to);
        $demandAnalysis = $this->calculateDemandAnalysis($from, $to);
        $productivityMetrics = $this->calculateProductivityMetrics($from, $to);
        $idleCapacity = $this->calculateIdleCapacityAnalysis($from, $to);
        $truckPerformance = $this->calculateTruckPerformanceBreakdown($from, $to);
        $recommendations = $this->generateOptimizationRecommendations(
            $fleetOverview,
            $utilizationAnalysis,
            $demandAnalysis,
            $productivityMetrics,
            $idleCapacity
        );
        $monthlyTrend = $this->calculateMonthlyCapacityTrend($from, $to);
        $weekdayPattern = $this->calculateWeekdayPattern($from, $to);

        return [
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'fleet_overview' => $fleetOverview,
            'utilization_analysis' => $utilizationAnalysis,
            'demand_analysis' => $demandAnalysis,
            'productivity_metrics' => $productivityMetrics,
            'idle_capacity' => $idleCapacity,
            'truck_performance' => $truckPerformance,
            'recommendations' => $recommendations,
            'monthly_trend' => $monthlyTrend,
            'weekday_pattern' => $weekdayPattern,
        ];
    }

    /**
     * Calculate fleet overview metrics.
     */
    private function calculateFleetOverview(CarbonInterface $from, CarbonInterface $to): array
    {
        $totalTrucks = Truck::count();
        $activeTrucks = Truck::where('status', 'active')->count();
        $maintenanceTrucks = Truck::where('status', 'maintenance')->count();
        $inactiveTrucks = Truck::whereIn('status', ['inactive', 'sold', 'retired'])->count();
        
        $daysInPeriod = $from->diffInDays($to) + 1;
        
        // Calculate active truck-days
        $activeTruckDays = DriverTruck::where('is_attached', true)
            ->where(function ($query) use ($from, $to) {
                $query->whereBetween('date_recived', [$from, $to])
                    ->orWhere(function ($q) use ($from, $to) {
                        $q->where('date_recived', '<=', $to)
                          ->where(function ($qq) use ($from) {
                              $qq->whereNull('date_detach')
                                ->orWhere('date_detach', '>=', $from);
                          });
                    });
            })
            ->count();
        
        $totalPossibleTruckDays = $activeTrucks * $daysInPeriod;
        $utilizationRate = $totalPossibleTruckDays > 0 ? ($activeTruckDays / $totalPossibleTruckDays) * 100 : 0;
        
        // Calculate trips and revenue
        $totalTrips = Performance::whereBetween('DateDispach', [$from, $to])->count();
        $operations = Operation::whereBetween('startdate', [$from, $to])->get();
        $totalRevenue = (float) $operations->sum('revenue');
        
        // Average utilization per truck
        $avgUtilizationPerTruck = $activeTrucks > 0 ? $utilizationRate : 0;

        return [
            'total_trucks' => $totalTrucks,
            'active_trucks' => $activeTrucks,
            'maintenance_trucks' => $maintenanceTrucks,
            'inactive_trucks' => $inactiveTrucks,
            'days_in_period' => $daysInPeriod,
            'active_truck_days' => $activeTruckDays,
            'total_possible_truck_days' => $totalPossibleTruckDays,
            'utilization_rate' => round($utilizationRate, 2),
            'idle_truck_days' => $totalPossibleTruckDays - $activeTruckDays,
            'total_trips' => $totalTrips,
            'total_revenue' => round($totalRevenue, 2),
            'avg_trips_per_truck' => $activeTrucks > 0 ? round($totalTrips / $activeTrucks, 2) : null,
            'avg_revenue_per_truck' => $activeTrucks > 0 ? round($totalRevenue / $activeTrucks, 2) : null,
        ];
    }

    /**
     * Calculate detailed utilization analysis.
     */
    private function calculateUtilizationAnalysis(CarbonInterface $from, CarbonInterface $to): array
    {
        $trucks = Truck::where('status', 'active')->get();
        $daysInPeriod = $from->diffInDays($to) + 1;
        
        $utilizationBuckets = [
            'high' => 0,      // > 80%
            'optimal' => 0,   // 60-80%
            'moderate' => 0,  // 40-60%
            'low' => 0,       // 20-40%
            'very_low' => 0,  // < 20%
            'unused' => 0,    // 0%
        ];
        
        $truckUtilizations = [];
        
        foreach ($trucks as $truck) {
            $activeDays = DriverTruck::where('truckId', $truck->id)
                ->where('is_attached', true)
                ->where(function ($query) use ($from, $to) {
                    $query->whereBetween('date_recived', [$from, $to])
                        ->orWhere(function ($q) use ($from, $to) {
                            $q->where('date_recived', '<=', $to)
                              ->where(function ($qq) use ($from) {
                                  $qq->whereNull('date_detach')
                                    ->orWhere('date_detach', '>=', $from);
                              });
                        });
                })
                ->count();
            
            $utilization = $daysInPeriod > 0 ? ($activeDays / $daysInPeriod) * 100 : 0;
            
            $truckUtilizations[] = [
                'truck_id' => $truck->id,
                'plate' => $truck->plate,
                'utilization' => round($utilization, 2),
                'active_days' => $activeDays,
                'idle_days' => $daysInPeriod - $activeDays,
            ];
            
            if ($utilization > 80) {
                $utilizationBuckets['high']++;
            } elseif ($utilization > 60) {
                $utilizationBuckets['optimal']++;
            } elseif ($utilization > 40) {
                $utilizationBuckets['moderate']++;
            } elseif ($utilization > 20) {
                $utilizationBuckets['low']++;
            } elseif ($utilization > 0) {
                $utilizationBuckets['very_low']++;
            } else {
                $utilizationBuckets['unused']++;
            }
        }
        
        // Sort by utilization descending
        usort($truckUtilizations, fn($a, $b) => $b['utilization'] <=> $a['utilization']);
        
        $avgUtilization = count($truckUtilizations) > 0 
            ? array_sum(array_column($truckUtilizations, 'utilization')) / count($truckUtilizations)
            : 0;

        return [
            'buckets' => $utilizationBuckets,
            'average_utilization' => round($avgUtilization, 2),
            'high_utilization_count' => $utilizationBuckets['high'],
            'optimal_utilization_count' => $utilizationBuckets['optimal'],
            'underutilized_count' => $utilizationBuckets['moderate'] + $utilizationBuckets['low'] + $utilizationBuckets['very_low'],
            'unused_count' => $utilizationBuckets['unused'],
            'truck_details' => $truckUtilizations,
        ];
    }

    /**
     * Calculate demand analysis metrics.
     */
    private function calculateDemandAnalysis(CarbonInterface $from, CarbonInterface $to): array
    {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])->get();
        $operations = Operation::whereBetween('startdate', [$from, $to])->get();
        
        $totalTrips = $performances->count();
        $totalTonnage = (float) $performances->sum('tonnage');
        $totalTonKm = (float) $performances->sum('tonkm');
        $totalDistance = (float) $performances->sum(fn($p) => ($p->DistanceWCargo ?? 0) + ($p->DistanceWOCargo ?? 0));
        
        $internalTrips = $operations->where('is_outsource', false)->count();
        $outsourceTrips = $operations->where('is_outsource', true)->count();
        $outsourceRate = $totalTrips > 0 ? ($outsourceTrips / $totalTrips) * 100 : 0;
        
        $daysInPeriod = $from->diffInDays($to) + 1;
        $avgTripsPerDay = $daysInPeriod > 0 ? $totalTrips / $daysInPeriod : 0;
        $avgTonnagePerDay = $daysInPeriod > 0 ? $totalTonnage / $daysInPeriod : 0;
        
        // Peak demand analysis
        $dailyTrips = $performances->groupBy(fn($p) => Carbon::parse($p->DateDispach)->format('Y-m-d'))
            ->map(fn($group) => $group->count())
            ->values();
        
        $peakDailyTrips = $dailyTrips->max() ?? 0;
        $minDailyTrips = $dailyTrips->min() ?? 0;
        $demandVariability = $avgTripsPerDay > 0 
            ? (($peakDailyTrips - $avgTripsPerDay) / $avgTripsPerDay) * 100 
            : 0;

        return [
            'total_trips' => $totalTrips,
            'internal_trips' => $internalTrips,
            'outsource_trips' => $outsourceTrips,
            'outsource_rate' => round($outsourceRate, 2),
            'total_tonnage' => round($totalTonnage, 2),
            'total_ton_km' => round($totalTonKm, 2),
            'total_distance' => round($totalDistance, 2),
            'avg_trips_per_day' => round($avgTripsPerDay, 2),
            'avg_tonnage_per_day' => round($avgTonnagePerDay, 2),
            'peak_daily_trips' => $peakDailyTrips,
            'min_daily_trips' => $minDailyTrips,
            'demand_variability' => round($demandVariability, 2),
        ];
    }

    /**
     * Calculate productivity metrics.
     */
    private function calculateProductivityMetrics(CarbonInterface $from, CarbonInterface $to): array
    {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])->get();
        $activeTrucks = Truck::where('status', 'active')->count();
        $daysInPeriod = $from->diffInDays($to) + 1;
        
        $totalDistance = (float) $performances->sum(fn($p) => ($p->DistanceWCargo ?? 0) + ($p->DistanceWOCargo ?? 0));
        $totalTonnage = (float) $performances->sum('tonnage');
        $totalTrips = $performances->count();
        
        $operations = Operation::whereBetween('startdate', [$from, $to])->get();
        $totalRevenue = (float) $operations->sum('revenue');
        
        $distancePerTruckPerDay = ($activeTrucks > 0 && $daysInPeriod > 0) 
            ? $totalDistance / ($activeTrucks * $daysInPeriod) 
            : 0;
        
        $tripsPerTruckPerDay = ($activeTrucks > 0 && $daysInPeriod > 0) 
            ? $totalTrips / ($activeTrucks * $daysInPeriod) 
            : 0;
        
        $tonnagePerTruckPerDay = ($activeTrucks > 0 && $daysInPeriod > 0) 
            ? $totalTonnage / ($activeTrucks * $daysInPeriod) 
            : 0;
        
        $revenuePerTruckPerDay = ($activeTrucks > 0 && $daysInPeriod > 0) 
            ? $totalRevenue / ($activeTrucks * $daysInPeriod) 
            : 0;
        
        $avgDistancePerTrip = $totalTrips > 0 ? $totalDistance / $totalTrips : 0;
        $avgTonnagePerTrip = $totalTrips > 0 ? $totalTonnage / $totalTrips : 0;
        $avgRevenuePerTrip = $totalTrips > 0 ? $totalRevenue / $totalTrips : 0;

        return [
            'distance_per_truck_per_day' => round($distancePerTruckPerDay, 2),
            'trips_per_truck_per_day' => round($tripsPerTruckPerDay, 2),
            'tonnage_per_truck_per_day' => round($tonnagePerTruckPerDay, 2),
            'revenue_per_truck_per_day' => round($revenuePerTruckPerDay, 2),
            'avg_distance_per_trip' => round($avgDistancePerTrip, 2),
            'avg_tonnage_per_trip' => round($avgTonnagePerTrip, 2),
            'avg_revenue_per_trip' => round($avgRevenuePerTrip, 2),
            'total_distance' => round($totalDistance, 2),
            'total_tonnage' => round($totalTonnage, 2),
            'total_trips' => $totalTrips,
        ];
    }

    /**
     * Calculate idle capacity cost analysis.
     */
    private function calculateIdleCapacityAnalysis(CarbonInterface $from, CarbonInterface $to): array
    {
        $activeTrucks = Truck::where('status', 'active')->count();
        $daysInPeriod = $from->diffInDays($to) + 1;
        $totalPossibleTruckDays = $activeTrucks * $daysInPeriod;
        
        $activeTruckDays = DriverTruck::where('is_attached', true)
            ->where(function ($query) use ($from, $to) {
                $query->whereBetween('date_recived', [$from, $to])
                    ->orWhere(function ($q) use ($from, $to) {
                        $q->where('date_recived', '<=', $to)
                          ->where(function ($qq) use ($from) {
                              $qq->whereNull('date_detach')
                                ->orWhere('date_detach', '>=', $from);
                          });
                    });
            })
            ->count();
        
        $idleTruckDays = $totalPossibleTruckDays - $activeTruckDays;
        $idleRate = $totalPossibleTruckDays > 0 ? ($idleTruckDays / $totalPossibleTruckDays) * 100 : 0;
        
        // Estimate cost of idle capacity
        $fleetValue = (float) Truck::where('status', 'active')->whereNotNull('purchasePrice')->sum('purchasePrice');
        $avgTruckValue = $activeTrucks > 0 ? $fleetValue / $activeTrucks : 0;
        
        // Fixed costs per truck per day (depreciation + insurance + financing)
        $depreciationPerDay = $avgTruckValue > 0 ? ($avgTruckValue * 0.10) / 365 : 0;
        $insurancePerDay = $avgTruckValue > 0 ? ($avgTruckValue * 0.03) / 365 : 0;
        $financingPerDay = $avgTruckValue > 0 ? ($avgTruckValue * 0.05) / 365 : 0;
        $fixedCostPerTruckPerDay = $depreciationPerDay + $insurancePerDay + $financingPerDay;
        
        $totalIdleCost = $idleTruckDays * $fixedCostPerTruckPerDay;
        
        // Potential revenue from idle capacity
        $operations = Operation::whereBetween('startdate', [$from, $to])->get();
        $totalRevenue = (float) $operations->sum('revenue');
        $avgRevenuePerTruckDay = $activeTruckDays > 0 ? $totalRevenue / $activeTruckDays : 0;
        $potentialRevenueFromIdle = $idleTruckDays * $avgRevenuePerTruckDay;
        
        $totalOpportunityCost = $totalIdleCost + $potentialRevenueFromIdle;

        return [
            'total_possible_truck_days' => $totalPossibleTruckDays,
            'active_truck_days' => $activeTruckDays,
            'idle_truck_days' => $idleTruckDays,
            'idle_rate' => round($idleRate, 2),
            'fixed_cost_per_truck_per_day' => round($fixedCostPerTruckPerDay, 2),
            'total_idle_cost' => round($totalIdleCost, 2),
            'avg_revenue_per_truck_day' => round($avgRevenuePerTruckDay, 2),
            'potential_revenue_from_idle' => round($potentialRevenueFromIdle, 2),
            'total_opportunity_cost' => round($totalOpportunityCost, 2),
            'avg_truck_value' => round($avgTruckValue, 2),
        ];
    }

    /**
     * Calculate individual truck performance breakdown.
     */
    private function calculateTruckPerformanceBreakdown(CarbonInterface $from, CarbonInterface $to): array
    {
        $trucks = Truck::where('status', 'active')->get();
        $daysInPeriod = $from->diffInDays($to) + 1;
        
        $truckPerformance = [];
        
        foreach ($trucks as $truck) {
            $activeDays = DriverTruck::where('truckId', $truck->id)
                ->where('is_attached', true)
                ->where(function ($query) use ($from, $to) {
                    $query->whereBetween('date_recived', [$from, $to])
                        ->orWhere(function ($q) use ($from, $to) {
                            $q->where('date_recived', '<=', $to)
                              ->where(function ($qq) use ($from) {
                                  $qq->whereNull('date_detach')
                                    ->orWhere('date_detach', '>=', $from);
                              });
                        });
                })
                ->count();
            
            $performances = Performance::where('TruckId', $truck->id)
                ->whereBetween('DateDispach', [$from, $to])
                ->get();
            
            $trips = $performances->count();
            $distance = (float) $performances->sum(fn($p) => ($p->DistanceWCargo ?? 0) + ($p->DistanceWOCargo ?? 0));
            $tonnage = (float) $performances->sum('tonnage');
            
            $operations = Operation::whereHas('performances', function ($query) use ($truck, $from, $to) {
                $query->where('TruckId', $truck->id)
                    ->whereBetween('DateDispach', [$from, $to]);
            })->get();
            
            $revenue = (float) $operations->sum('revenue');
            
            $utilization = $daysInPeriod > 0 ? ($activeDays / $daysInPeriod) * 100 : 0;
            $tripsPerDay = $activeDays > 0 ? $trips / $activeDays : 0;
            $revenuePerDay = $activeDays > 0 ? $revenue / $activeDays : 0;
            
            $truckPerformance[] = [
                'truck_id' => $truck->id,
                'plate' => $truck->plate,
                'vehicle_type' => $truck->vehicleType?->vehicleType ?? 'N/A',
                'active_days' => $activeDays,
                'idle_days' => $daysInPeriod - $activeDays,
                'utilization' => round($utilization, 2),
                'trips' => $trips,
                'distance_km' => round($distance, 2),
                'tonnage' => round($tonnage, 2),
                'revenue' => round($revenue, 2),
                'trips_per_day' => round($tripsPerDay, 2),
                'revenue_per_day' => round($revenuePerDay, 2),
            ];
        }
        
        // Sort by revenue descending
        usort($truckPerformance, fn($a, $b) => $b['revenue'] <=> $a['revenue']);
        
        return $truckPerformance;
    }

    /**
     * Generate optimization recommendations.
     */
    private function generateOptimizationRecommendations(
        array $fleetOverview,
        array $utilizationAnalysis,
        array $demandAnalysis,
        array $productivityMetrics,
        array $idleCapacity
    ): array {
        $recommendations = [];
        
        // Fleet size recommendations
        $utilizationRate = $fleetOverview['utilization_rate'];
        $outsourceRate = $demandAnalysis['outsource_rate'];
        $idleRate = $idleCapacity['idle_rate'];
        $underutilizedCount = $utilizationAnalysis['underutilized_count'];
        $unusedCount = $utilizationAnalysis['unused_count'];
        
        if ($utilizationRate < 50) {
            $recommendations[] = [
                'priority' => 'high',
                'category' => 'fleet_sizing',
                'title' => 'Significant Overcapacity Detected',
                'description' => sprintf(
                    'Fleet utilization is only %.1f%%. Consider reducing fleet size by %d trucks or increasing marketing efforts to capture more demand.',
                    $utilizationRate,
                    ceil($underutilizedCount * 0.5)
                ),
                'potential_savings' => $idleCapacity['total_opportunity_cost'] * 0.5,
            ];
        } elseif ($utilizationRate < 65) {
            $recommendations[] = [
                'priority' => 'medium',
                'category' => 'fleet_sizing',
                'title' => 'Moderate Overcapacity',
                'description' => sprintf(
                    'Fleet utilization is %.1f%%. Consider optimizing fleet size or improving load matching to increase utilization.',
                    $utilizationRate
                ),
                'potential_savings' => $idleCapacity['total_opportunity_cost'] * 0.3,
            ];
        } elseif ($utilizationRate > 85 && $outsourceRate > 15) {
            $recommendations[] = [
                'priority' => 'high',
                'category' => 'fleet_sizing',
                'title' => 'Fleet Expansion Opportunity',
                'description' => sprintf(
                    'Fleet utilization is %.1f%% and %.1f%% of trips are outsourced. Consider expanding fleet by %d trucks to capture this demand internally.',
                    $utilizationRate,
                    $outsourceRate,
                    ceil($fleetOverview['active_trucks'] * ($outsourceRate / 100))
                ),
                'potential_revenue' => $demandAnalysis['outsource_trips'] * $productivityMetrics['avg_revenue_per_trip'],
            ];
        }
        
        // Idle capacity recommendations
        if ($unusedCount > 0) {
            $recommendations[] = [
                'priority' => 'high',
                'category' => 'idle_capacity',
                'title' => 'Unused Trucks Identified',
                'description' => sprintf(
                    '%d trucks have 0%% utilization. Consider selling, leasing out, or reassigning these assets.',
                    $unusedCount
                ),
                'potential_savings' => $unusedCount * $idleCapacity['fixed_cost_per_truck_per_day'] * $fleetOverview['days_in_period'],
            ];
        }
        
        if ($idleRate > 30) {
            $recommendations[] = [
                'priority' => 'medium',
                'category' => 'idle_capacity',
                'title' => 'High Idle Capacity Cost',
                'description' => sprintf(
                    '%.1f%% of available truck-days are idle, costing %s in opportunity cost. Improve scheduling and load matching.',
                    $idleRate,
                    number_format($idleCapacity['total_opportunity_cost'], 0)
                ),
                'potential_savings' => $idleCapacity['total_opportunity_cost'] * 0.4,
            ];
        }
        
        // Productivity recommendations
        $tripsPerTruckPerDay = $productivityMetrics['trips_per_truck_per_day'];
        
        if ($tripsPerTruckPerDay < 0.5) {
            $recommendations[] = [
                'priority' => 'medium',
                'category' => 'productivity',
                'title' => 'Low Trip Frequency',
                'description' => sprintf(
                    'Trucks average only %.2f trips per day. Improve route planning and reduce turnaround times to increase productivity.',
                    $tripsPerTruckPerDay
                ),
                'potential_revenue' => $fleetOverview['active_trucks'] * $fleetOverview['days_in_period'] * $productivityMetrics['avg_revenue_per_trip'] * 0.3,
            ];
        }
        
        // Demand variability recommendations
        $demandVariability = $demandAnalysis['demand_variability'];
        
        if ($demandVariability > 50) {
            $recommendations[] = [
                'priority' => 'medium',
                'category' => 'demand_management',
                'title' => 'High Demand Variability',
                'description' => sprintf(
                    'Peak demand is %.1f%% above average. Consider flexible capacity arrangements (spot leasing, partnerships) to handle peaks.',
                    $demandVariability
                ),
                'potential_savings' => $idleCapacity['total_idle_cost'] * 0.2,
            ];
        }
        
        // Optimal fleet size calculation
        $optimalFleetSize = $this->calculateOptimalFleetSize(
            $fleetOverview,
            $demandAnalysis,
            $productivityMetrics
        );
        
        if ($optimalFleetSize['recommended_change'] !== 0) {
            $action = $optimalFleetSize['recommended_change'] > 0 ? 'add' : 'reduce';
            $count = abs($optimalFleetSize['recommended_change']);
            
            $recommendations[] = [
                'priority' => 'high',
                'category' => 'fleet_sizing',
                'title' => 'Optimal Fleet Size Recommendation',
                'description' => sprintf(
                    'Based on demand patterns and utilization, %s %d truck%s to reach optimal fleet size of %d.',
                    $action,
                    $count,
                    $count > 1 ? 's' : '',
                    $optimalFleetSize['optimal_size']
                ),
                'optimal_fleet_size' => $optimalFleetSize['optimal_size'],
                'current_fleet_size' => $optimalFleetSize['current_size'],
                'expected_utilization' => $optimalFleetSize['expected_utilization'],
            ];
        }
        
        // Sort by priority
        usort($recommendations, function ($a, $b) {
            $priorityOrder = ['high' => 1, 'medium' => 2, 'low' => 3];
            return ($priorityOrder[$a['priority']] ?? 99) <=> ($priorityOrder[$b['priority']] ?? 99);
        });
        
        return $recommendations;
    }

    /**
     * Calculate optimal fleet size.
     */
    private function calculateOptimalFleetSize(
        array $fleetOverview,
        array $demandAnalysis,
        array $productivityMetrics
    ): array {
        $currentSize = $fleetOverview['active_trucks'];
        $avgTripsPerDay = $demandAnalysis['avg_trips_per_day'];
        $tripsPerTruckPerDay = $productivityMetrics['trips_per_truck_per_day'];
        
        // Target utilization: 75% (allows for flexibility while minimizing idle capacity)
        $targetUtilization = 0.75;
        
        // Calculate optimal fleet size based on demand and target utilization
        $optimalSize = $tripsPerTruckPerDay > 0 
            ? ceil(($avgTripsPerDay / $tripsPerTruckPerDay) / $targetUtilization)
            : $currentSize;
        
        // Don't recommend changes smaller than 10% of fleet or less than 2 trucks
        $changeThreshold = max(2, ceil($currentSize * 0.10));
        $recommendedChange = abs($optimalSize - $currentSize) >= $changeThreshold 
            ? $optimalSize - $currentSize 
            : 0;
        
        $expectedUtilization = $optimalSize > 0 
            ? ($currentSize / $optimalSize) * $fleetOverview['utilization_rate']
            : $fleetOverview['utilization_rate'];

        return [
            'current_size' => $currentSize,
            'optimal_size' => $optimalSize,
            'recommended_change' => $recommendedChange,
            'expected_utilization' => round($expectedUtilization, 2),
        ];
    }

    /**
     * Calculate monthly capacity trend.
     */
    private function calculateMonthlyCapacityTrend(CarbonInterface $from, CarbonInterface $to): array
    {
        $trends = [];
        $currentMonth = $from->copy()->startOfMonth();
        $endMonth = $to->copy()->endOfMonth();
        
        while ($currentMonth <= $endMonth) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();
            
            if ($monthStart < $from) $monthStart = $from->copy();
            if ($monthEnd > $to) $monthEnd = $to->copy();
            
            $daysInMonth = $monthStart->diffInDays($monthEnd) + 1;
            $activeTrucks = Truck::where('status', 'active')->count();
            
            $activeTruckDays = DriverTruck::where('is_attached', true)
                ->where(function ($query) use ($monthStart, $monthEnd) {
                    $query->whereBetween('date_recived', [$monthStart, $monthEnd])
                        ->orWhere(function ($q) use ($monthStart, $monthEnd) {
                            $q->where('date_recived', '<=', $monthEnd)
                              ->where(function ($qq) use ($monthStart) {
                                  $qq->whereNull('date_detach')
                                    ->orWhere('date_detach', '>=', $monthStart);
                              });
                        });
                })
                ->count();
            
            $totalPossible = $activeTrucks * $daysInMonth;
            $utilization = $totalPossible > 0 ? ($activeTruckDays / $totalPossible) * 100 : 0;
            
            $trips = Performance::whereBetween('DateDispach', [$monthStart, $monthEnd])->count();
            $avgTripsPerDay = $daysInMonth > 0 ? $trips / $daysInMonth : 0;
            
            $trends[] = [
                'month' => $currentMonth->format('M Y'),
                'year' => (int) $currentMonth->year,
                'month_num' => (int) $currentMonth->month,
                'utilization' => round($utilization, 2),
                'active_truck_days' => $activeTruckDays,
                'total_possible_truck_days' => $totalPossible,
                'trips' => $trips,
                'avg_trips_per_day' => round($avgTripsPerDay, 2),
            ];
            
            $currentMonth->addMonth();
        }
        
        return $trends;
    }

    /**
     * Calculate weekday utilization pattern.
     */
    private function calculateWeekdayPattern(CarbonInterface $from, CarbonInterface $to): array
    {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])->get();
        
        $weekdayStats = [
            'Monday' => ['trips' => 0, 'days' => 0],
            'Tuesday' => ['trips' => 0, 'days' => 0],
            'Wednesday' => ['trips' => 0, 'days' => 0],
            'Thursday' => ['trips' => 0, 'days' => 0],
            'Friday' => ['trips' => 0, 'days' => 0],
            'Saturday' => ['trips' => 0, 'days' => 0],
            'Sunday' => ['trips' => 0, 'days' => 0],
        ];
        
        // Count days for each weekday
        $currentDate = $from->copy();
        while ($currentDate <= $to) {
            $dayName = $currentDate->format('l');
            $weekdayStats[$dayName]['days']++;
            $currentDate->addDay();
        }
        
        // Count trips by weekday
        foreach ($performances as $performance) {
            $dayName = Carbon::parse($performance->DateDispach)->format('l');
            $weekdayStats[$dayName]['trips']++;
        }
        
        // Calculate averages
        $pattern = [];
        foreach ($weekdayStats as $day => $stats) {
            $avgTrips = $stats['days'] > 0 ? $stats['trips'] / $stats['days'] : 0;
            $pattern[] = [
                'day' => $day,
                'total_trips' => $stats['trips'],
                'days_count' => $stats['days'],
                'avg_trips_per_day' => round($avgTrips, 2),
            ];
        }
        
        return $pattern;
    }

    /**
     * Resolve date range from filters.
     */
    private function resolveDateRange(array $filters): array
    {
        $from = isset($filters['from']) ? Carbon::parse($filters['from'])->startOfDay() : Carbon::now()->subDays(89)->startOfDay();
        $to = isset($filters['to']) ? Carbon::parse($filters['to'])->endOfDay() : Carbon::now()->endOfDay();

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [$from, $to];
    }
}

