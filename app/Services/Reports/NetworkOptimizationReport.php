<?php

namespace App\Services\Reports;

use App\Models\Performance;
use App\Models\Place;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class NetworkOptimizationReport
{
    /**
     * Build comprehensive network optimization and backhaul analysis.
     */
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);

        $emptyMilesAnalysis = $this->calculateEmptyMilesAnalysis($from, $to);
        $backhaulOpportunities = $this->calculateBackhaulOpportunities($from, $to);
        $laneAnalysis = $this->calculateLaneAnalysis($from, $to);
        $routeBalance = $this->calculateRouteBalance($from, $to);
        $geographicClusters = $this->calculateGeographicClusters($from, $to);
        $deadheadCostAnalysis = $this->calculateDeadheadCostAnalysis($from, $to);
        $backhaulRevenueOpportunity = $this->calculateBackhaulRevenueOpportunity($from, $to, $emptyMilesAnalysis, $laneAnalysis);
        $recommendations = $this->generateOptimizationRecommendations(
            $emptyMilesAnalysis,
            $backhaulOpportunities,
            $laneAnalysis,
            $routeBalance,
            $deadheadCostAnalysis,
            $backhaulRevenueOpportunity
        );
        $topImbalancedLanes = $this->identifyTopImbalancedLanes($laneAnalysis);

        return [
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'empty_miles_analysis' => $emptyMilesAnalysis,
            'backhaul_opportunities' => $backhaulOpportunities,
            'lane_analysis' => $laneAnalysis,
            'route_balance' => $routeBalance,
            'geographic_clusters' => $geographicClusters,
            'deadhead_cost_analysis' => $deadheadCostAnalysis,
            'backhaul_revenue_opportunity' => $backhaulRevenueOpportunity,
            'recommendations' => $recommendations,
            'top_imbalanced_lanes' => $topImbalancedLanes,
        ];
    }

    /**
     * Calculate empty miles analysis.
     */
    private function calculateEmptyMilesAnalysis(CarbonInterface $from, CarbonInterface $to): array
    {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])->get();

        $totalLoadedMiles = (float) $performances->sum('DistanceWCargo');
        $totalEmptyMiles = (float) $performances->sum('DistanceWOCargo');
        $totalMiles = $totalLoadedMiles + $totalEmptyMiles;

        $emptyMilesRatio = $totalMiles > 0 ? ($totalEmptyMiles / $totalMiles) * 100 : 0;
        $loadedMilesRatio = $totalMiles > 0 ? ($totalLoadedMiles / $totalMiles) * 100 : 0;

        $totalTrips = $performances->count();
        $tripsWithEmptyMiles = $performances->filter(fn($p) => ($p->DistanceWOCargo ?? 0) > 0)->count();
        $tripsWithoutEmptyMiles = $totalTrips - $tripsWithEmptyMiles;

        $avgEmptyMilesPerTrip = $totalTrips > 0 ? $totalEmptyMiles / $totalTrips : 0;
        $avgLoadedMilesPerTrip = $totalTrips > 0 ? $totalLoadedMiles / $totalTrips : 0;

        // Industry benchmark (typically 15-25% empty miles is acceptable)
        $industryBenchmark = 20;
        $performanceVsBenchmark = $emptyMilesRatio - $industryBenchmark;

        return [
            'total_miles' => round($totalMiles, 2),
            'total_loaded_miles' => round($totalLoadedMiles, 2),
            'total_empty_miles' => round($totalEmptyMiles, 2),
            'empty_miles_ratio' => round($emptyMilesRatio, 2),
            'loaded_miles_ratio' => round($loadedMilesRatio, 2),
            'total_trips' => $totalTrips,
            'trips_with_empty_miles' => $tripsWithEmptyMiles,
            'trips_without_empty_miles' => $tripsWithoutEmptyMiles,
            'avg_empty_miles_per_trip' => round($avgEmptyMilesPerTrip, 2),
            'avg_loaded_miles_per_trip' => round($avgLoadedMilesPerTrip, 2),
            'industry_benchmark' => $industryBenchmark,
            'performance_vs_benchmark' => round($performanceVsBenchmark, 2),
        ];
    }

    /**
     * Calculate backhaul opportunities.
     */
    private function calculateBackhaulOpportunities(CarbonInterface $from, CarbonInterface $to): array
    {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])
            ->with(['origin', 'destination'])
            ->get();

        $opportunities = [];

        // Group by destination to find common drop-off points
        $destinationGroups = $performances->groupBy('destinationId');

        foreach ($destinationGroups as $destinationId => $trips) {
            if ($trips->count() < 2) {
                continue; // Need at least 2 trips to identify backhaul
            }

            $destination = $trips->first()->destination;
            $destinationName = $destination?->name ?? "Destination #{$destinationId}";

            // Find trips originating from this destination (potential backhaul)
            $backhaulTrips = $performances->where('originId', $destinationId)->count();
            $outboundTrips = $trips->count();

            $totalEmptyMiles = (float) $trips->sum('DistanceWOCargo');
            $avgEmptyMiles = $trips->count() > 0 ? $totalEmptyMiles / $trips->count() : 0;

            // Backhaul utilization rate
            $backhaulUtilization = $outboundTrips > 0 ? ($backhaulTrips / $outboundTrips) * 100 : 0;
            $backhaulGap = max(0, $outboundTrips - $backhaulTrips);

            $opportunities[] = [
                'destination_id' => $destinationId,
                'destination_name' => $destinationName,
                'outbound_trips' => $outboundTrips,
                'backhaul_trips' => $backhaulTrips,
                'backhaul_utilization' => round($backhaulUtilization, 2),
                'backhaul_gap' => $backhaulGap,
                'total_empty_miles' => round($totalEmptyMiles, 2),
                'avg_empty_miles' => round($avgEmptyMiles, 2),
            ];
        }

        // Sort by backhaul gap (highest opportunity first)
        usort($opportunities, fn($a, $b) => $b['backhaul_gap'] <=> $a['backhaul_gap']);

        // Calculate summary
        $totalBackhaulGap = array_sum(array_column($opportunities, 'backhaul_gap'));
        $avgBackhaulUtilization = count($opportunities) > 0
            ? array_sum(array_column($opportunities, 'backhaul_utilization')) / count($opportunities)
            : 0;

        return [
            'opportunities' => array_slice($opportunities, 0, 20), // Top 20
            'total_opportunities' => count($opportunities),
            'total_backhaul_gap' => $totalBackhaulGap,
            'avg_backhaul_utilization' => round($avgBackhaulUtilization, 2),
        ];
    }

    /**
     * Calculate lane analysis (origin-destination pairs).
     */
    private function calculateLaneAnalysis(CarbonInterface $from, CarbonInterface $to): array
    {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])
            ->with(['origin', 'destination'])
            ->get();

        $lanes = [];

        // Group by origin-destination pair
        $laneGroups = $performances->groupBy(function ($performance) {
            return $performance->originId.'-'.$performance->destinationId;
        });

        foreach ($laneGroups as $laneKey => $trips) {
            [$originId, $destinationId] = explode('-', $laneKey);

            $firstTrip = $trips->first();
            $originName = $firstTrip->origin?->name ?? "Origin #{$originId}";
            $destinationName = $firstTrip->destination?->name ?? "Destination #{$destinationId}";

            $tripCount = $trips->count();
            $totalDistance = (float) $trips->sum(fn($p) => ($p->DistanceWCargo ?? 0) + ($p->DistanceWOCargo ?? 0));
            $loadedDistance = (float) $trips->sum('DistanceWCargo');
            $emptyDistance = (float) $trips->sum('DistanceWOCargo');
            $tonnage = (float) $trips->sum('tonnage');

            $avgDistance = $tripCount > 0 ? $totalDistance / $tripCount : 0;
            $emptyRatio = $totalDistance > 0 ? ($emptyDistance / $totalDistance) * 100 : 0;

            // Check for reverse lane
            $reverseLaneKey = $destinationId.'-'.$originId;
            $reverseTrips = $laneGroups->get($reverseLaneKey);
            $reverseTripCount = $reverseTrips ? $reverseTrips->count() : 0;

            // Lane balance (how balanced is the lane in both directions)
            $laneBalance = min($tripCount, $reverseTripCount) > 0
                ? (min($tripCount, $reverseTripCount) / max($tripCount, $reverseTripCount)) * 100
                : 0;

            $lanes[] = [
                'origin_id' => (int) $originId,
                'destination_id' => (int) $destinationId,
                'origin_name' => $originName,
                'destination_name' => $destinationName,
                'trip_count' => $tripCount,
                'reverse_trip_count' => $reverseTripCount,
                'total_distance' => round($totalDistance, 2),
                'loaded_distance' => round($loadedDistance, 2),
                'empty_distance' => round($emptyDistance, 2),
                'tonnage' => round($tonnage, 2),
                'avg_distance' => round($avgDistance, 2),
                'empty_ratio' => round($emptyRatio, 2),
                'lane_balance' => round($laneBalance, 2),
            ];
        }

        // Sort by trip count (most active lanes first)
        usort($lanes, fn($a, $b) => $b['trip_count'] <=> $a['trip_count']);

        return $lanes;
    }

    /**
     * Calculate route balance (inbound vs outbound by location).
     */
    private function calculateRouteBalance(CarbonInterface $from, CarbonInterface $to): array
    {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])
            ->with(['origin', 'destination'])
            ->get();

        $locationBalance = [];

        // Count inbound and outbound trips for each location
        $locations = $performances->pluck('originId')
            ->merge($performances->pluck('destinationId'))
            ->unique()
            ->filter();

        foreach ($locations as $locationId) {
            $outboundTrips = $performances->where('originId', $locationId)->count();
            $inboundTrips = $performances->where('destinationId', $locationId)->count();

            $totalTrips = $outboundTrips + $inboundTrips;
            $netFlow = $outboundTrips - $inboundTrips;
            $balanceRatio = max($outboundTrips, $inboundTrips) > 0
                ? (min($outboundTrips, $inboundTrips) / max($outboundTrips, $inboundTrips)) * 100
                : 0;

            // Get location name
            $location = Place::find($locationId);
            $locationName = $location?->name ?? "Location #{$locationId}";

            $locationBalance[] = [
                'location_id' => $locationId,
                'location_name' => $locationName,
                'outbound_trips' => $outboundTrips,
                'inbound_trips' => $inboundTrips,
                'total_trips' => $totalTrips,
                'net_flow' => $netFlow,
                'balance_ratio' => round($balanceRatio, 2),
                'flow_type' => $netFlow > 0 ? 'source' : ($netFlow < 0 ? 'sink' : 'balanced'),
            ];
        }

        // Sort by total trips
        usort($locationBalance, fn($a, $b) => $b['total_trips'] <=> $a['total_trips']);

        return array_slice($locationBalance, 0, 30); // Top 30 locations
    }

    /**
     * Calculate geographic clusters.
     */
    private function calculateGeographicClusters(CarbonInterface $from, CarbonInterface $to): array
    {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])
            ->with(['origin.region', 'destination.region'])
            ->get();

        $regionPairs = [];

        foreach ($performances as $performance) {
            $originRegion = $performance->origin?->region?->name ?? 'Unknown';
            $destinationRegion = $performance->destination?->region?->name ?? 'Unknown';

            $key = $originRegion.' → '.$destinationRegion;

            if (! isset($regionPairs[$key])) {
                $regionPairs[$key] = [
                    'origin_region' => $originRegion,
                    'destination_region' => $destinationRegion,
                    'trip_count' => 0,
                    'total_distance' => 0,
                    'total_tonnage' => 0,
                    'total_empty_miles' => 0,
                ];
            }

            $regionPairs[$key]['trip_count']++;
            $regionPairs[$key]['total_distance'] += ($performance->DistanceWCargo ?? 0) + ($performance->DistanceWOCargo ?? 0);
            $regionPairs[$key]['total_tonnage'] += $performance->tonnage ?? 0;
            $regionPairs[$key]['total_empty_miles'] += $performance->DistanceWOCargo ?? 0;
        }

        // Convert to array and calculate metrics
        $clusters = array_values($regionPairs);

        foreach ($clusters as &$cluster) {
            $cluster['total_distance'] = round($cluster['total_distance'], 2);
            $cluster['total_tonnage'] = round($cluster['total_tonnage'], 2);
            $cluster['total_empty_miles'] = round($cluster['total_empty_miles'], 2);
            $cluster['empty_ratio'] = $cluster['total_distance'] > 0
                ? round(($cluster['total_empty_miles'] / $cluster['total_distance']) * 100, 2)
                : 0;
        }

        // Sort by trip count
        usort($clusters, fn($a, $b) => $b['trip_count'] <=> $a['trip_count']);

        return array_slice($clusters, 0, 20); // Top 20 regional corridors
    }

    /**
     * Calculate deadhead cost analysis.
     */
    private function calculateDeadheadCostAnalysis(CarbonInterface $from, CarbonInterface $to): array
    {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])->get();

        $totalEmptyMiles = (float) $performances->sum('DistanceWOCargo');
        $totalFuelCost = (float) $performances->sum('fuelInBirr');
        $totalDistance = (float) $performances->sum(fn($p) => ($p->DistanceWCargo ?? 0) + ($p->DistanceWOCargo ?? 0));

        // Estimate cost per km
        $costPerKm = $totalDistance > 0 ? $totalFuelCost / $totalDistance : 0;

        // Deadhead cost (cost of running empty)
        $deadheadFuelCost = $totalEmptyMiles * $costPerKm;

        // Additional costs for empty miles (maintenance, tire wear, driver time)
        $maintenanceCostPerKm = $costPerKm * 0.3; // Estimate maintenance at 30% of fuel cost
        $deadheadMaintenanceCost = $totalEmptyMiles * $maintenanceCostPerKm;

        $totalDeadheadCost = $deadheadFuelCost + $deadheadMaintenanceCost;

        // Cost per trip with empty miles
        $tripsWithEmptyMiles = $performances->filter(fn($p) => ($p->DistanceWOCargo ?? 0) > 0)->count();
        $avgDeadheadCostPerTrip = $tripsWithEmptyMiles > 0 ? $totalDeadheadCost / $tripsWithEmptyMiles : 0;

        return [
            'total_empty_miles' => round($totalEmptyMiles, 2),
            'cost_per_km' => round($costPerKm, 2),
            'deadhead_fuel_cost' => round($deadheadFuelCost, 2),
            'deadhead_maintenance_cost' => round($deadheadMaintenanceCost, 2),
            'total_deadhead_cost' => round($totalDeadheadCost, 2),
            'avg_deadhead_cost_per_trip' => round($avgDeadheadCostPerTrip, 2),
            'trips_with_empty_miles' => $tripsWithEmptyMiles,
        ];
    }

    /**
     * Calculate backhaul revenue opportunity.
     */
    private function calculateBackhaulRevenueOpportunity(
        CarbonInterface $from,
        CarbonInterface $to,
        array $emptyMilesAnalysis,
        array $laneAnalysis
    ): array {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])->get();

        // Average revenue per loaded km
        $totalRevenue = (float) $performances->sum(function ($perf) {
            return $perf->operation?->revenue ?? 0;
        });
        $totalLoadedMiles = $emptyMilesAnalysis['total_loaded_miles'];
        $avgRevenuePerLoadedKm = $totalLoadedMiles > 0 ? $totalRevenue / $totalLoadedMiles : 0;

        // Potential revenue if 50% of empty miles were converted to loaded miles
        $totalEmptyMiles = $emptyMilesAnalysis['total_empty_miles'];
        $convertibleEmptyMiles = $totalEmptyMiles * 0.50; // Assume 50% is realistically convertible
        $potentialBackhaulRevenue = $convertibleEmptyMiles * $avgRevenuePerLoadedKm;

        // Find lanes with highest backhaul potential (high empty ratio + high trip volume)
        $highPotentialLanes = collect($laneAnalysis)
            ->filter(fn($lane) => $lane['empty_ratio'] > 20 && $lane['trip_count'] >= 5)
            ->sortByDesc(fn($lane) => $lane['empty_distance'])
            ->take(10)
            ->values()
            ->all();

        $potentialRevenueFromTopLanes = array_sum(array_map(
            fn($lane) => ($lane['empty_distance'] * 0.5 * $avgRevenuePerLoadedKm),
            $highPotentialLanes
        ));

        return [
            'avg_revenue_per_loaded_km' => round($avgRevenuePerLoadedKm, 2),
            'total_empty_miles' => round($totalEmptyMiles, 2),
            'convertible_empty_miles' => round($convertibleEmptyMiles, 2),
            'potential_backhaul_revenue' => round($potentialBackhaulRevenue, 2),
            'high_potential_lanes' => $highPotentialLanes,
            'potential_revenue_from_top_lanes' => round($potentialRevenueFromTopLanes, 2),
        ];
    }

    /**
     * Generate optimization recommendations.
     */
    private function generateOptimizationRecommendations(
        array $emptyMilesAnalysis,
        array $backhaulOpportunities,
        array $laneAnalysis,
        array $routeBalance,
        array $deadheadCostAnalysis,
        array $backhaulRevenueOpportunity
    ): array {
        $recommendations = [];

        $emptyMilesRatio = $emptyMilesAnalysis['empty_miles_ratio'];
        $performanceVsBenchmark = $emptyMilesAnalysis['performance_vs_benchmark'];

        // High empty miles
        if ($emptyMilesRatio > 30) {
            $recommendations[] = [
                'priority' => 'high',
                'category' => 'empty_miles',
                'title' => 'Critical: Excessive Empty Miles',
                'description' => sprintf(
                    'Empty miles ratio is %.1f%%, significantly above industry benchmark of 20%%. Focus on backhaul opportunities and route optimization to reduce deadhead costs of %s.',
                    $emptyMilesRatio,
                    number_format($deadheadCostAnalysis['total_deadhead_cost'], 0)
                ),
                'potential_savings' => $deadheadCostAnalysis['total_deadhead_cost'] * 0.3,
                'potential_revenue' => $backhaulRevenueOpportunity['potential_backhaul_revenue'] * 0.3,
            ];
        } elseif ($emptyMilesRatio > 20) {
            $recommendations[] = [
                'priority' => 'medium',
                'category' => 'empty_miles',
                'title' => 'Moderate Empty Miles',
                'description' => sprintf(
                    'Empty miles ratio is %.1f%%, above the 20%% benchmark. Identify backhaul opportunities on high-volume lanes to improve efficiency.',
                    $emptyMilesRatio
                ),
                'potential_savings' => $deadheadCostAnalysis['total_deadhead_cost'] * 0.2,
                'potential_revenue' => $backhaulRevenueOpportunity['potential_backhaul_revenue'] * 0.2,
            ];
        }

        // Low backhaul utilization
        $avgBackhaulUtilization = $backhaulOpportunities['avg_backhaul_utilization'];
        if ($avgBackhaulUtilization < 50) {
            $recommendations[] = [
                'priority' => 'high',
                'category' => 'backhaul',
                'title' => 'Major Backhaul Opportunity',
                'description' => sprintf(
                    'Average backhaul utilization is only %.1f%%. Target the %d backhaul gaps identified to capture additional revenue of approximately %s.',
                    $avgBackhaulUtilization,
                    $backhaulOpportunities['total_backhaul_gap'],
                    number_format($backhaulRevenueOpportunity['potential_backhaul_revenue'], 0)
                ),
                'potential_revenue' => $backhaulRevenueOpportunity['potential_backhaul_revenue'],
            ];
        }

        // Imbalanced lanes
        $imbalancedLanes = collect($laneAnalysis)->filter(fn($lane) => $lane['lane_balance'] < 50 && $lane['trip_count'] >= 5)->count();
        if ($imbalancedLanes > 0) {
            $recommendations[] = [
                'priority' => 'medium',
                'category' => 'lane_balance',
                'title' => 'Lane Imbalance Optimization',
                'description' => sprintf(
                    '%d lanes have poor balance (<50%%). Develop partnerships or pricing strategies to capture return loads on imbalanced lanes.',
                    $imbalancedLanes
                ),
                'potential_revenue' => $backhaulRevenueOpportunity['potential_revenue_from_top_lanes'],
            ];
        }

        // High deadhead costs
        if ($deadheadCostAnalysis['total_deadhead_cost'] > 100000) {
            $recommendations[] = [
                'priority' => 'high',
                'category' => 'cost_reduction',
                'title' => 'Significant Deadhead Cost Reduction',
                'description' => sprintf(
                    'Deadhead costs total %s. Implement backhaul programs, load boards, and network optimization to reduce by 20-30%%.',
                    number_format($deadheadCostAnalysis['total_deadhead_cost'], 0)
                ),
                'potential_savings' => $deadheadCostAnalysis['total_deadhead_cost'] * 0.25,
            ];
        }

        // Imbalanced locations (sources without sinks)
        $sources = collect($routeBalance)->where('flow_type', 'source')->count();
        $sinks = collect($routeBalance)->where('flow_type', 'sink')->count();
        $imbalance = abs($sources - $sinks);

        if ($imbalance > 3) {
            $recommendations[] = [
                'priority' => 'medium',
                'category' => 'network_balance',
                'title' => 'Network Rebalancing Needed',
                'description' => sprintf(
                    'Network has %d source locations and %d sink locations, creating imbalance. Develop dedicated lanes or partnerships to rebalance the network.',
                    $sources,
                    $sinks
                ),
                'potential_revenue' => $backhaulRevenueOpportunity['potential_backhaul_revenue'] * 0.15,
            ];
        }

        // Strategic recommendations based on patterns
        if (count($backhaulRevenueOpportunity['high_potential_lanes']) > 5) {
            $recommendations[] = [
                'priority' => 'high',
                'category' => 'strategic',
                'title' => 'Dedicated Backhaul Program',
                'description' => sprintf(
                    '%d high-volume lanes have significant backhaul potential. Launch a dedicated backhaul program with pricing incentives and partnerships on these corridors.',
                    count($backhaulRevenueOpportunity['high_potential_lanes'])
                ),
                'potential_revenue' => $backhaulRevenueOpportunity['potential_revenue_from_top_lanes'],
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
     * Identify top imbalanced lanes for quick action.
     */
    private function identifyTopImbalancedLanes(array $laneAnalysis): array
    {
        return collect($laneAnalysis)
            ->filter(fn($lane) => $lane['lane_balance'] < 50 && $lane['trip_count'] >= 5)
            ->sortByDesc('trip_count')
            ->take(15)
            ->values()
            ->all();
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

