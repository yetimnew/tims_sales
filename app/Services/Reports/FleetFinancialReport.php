<?php

namespace App\Services\Reports;

use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Truck;
use App\Models\VehicleMaintenanceRecord;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FleetFinancialReport
{
    /**
     * Build comprehensive fleet financial dashboard metrics.
     */
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);

        // Calculate all financial metrics
        $profitability = $this->calculateProfitabilityMetrics($from, $to);
        $revenue = $this->calculateRevenueMetrics($from, $to);
        $costs = $this->calculateCostStructure($from, $to);
        $cashFlow = $this->calculateCashFlowMetrics($from, $to);
        $capitalEfficiency = $this->calculateCapitalEfficiency($from, $to);
        $trends = $this->calculateFinancialTrends($from, $to);
        $breakdown = $this->calculateMonthlyBreakdown($from, $to);

        return [
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'profitability' => $profitability,
            'revenue' => $revenue,
            'costs' => $costs,
            'cash_flow' => $cashFlow,
            'capital_efficiency' => $capitalEfficiency,
            'trends' => $trends,
            'breakdown' => $breakdown,
        ];
    }

    /**
     * Calculate overall profitability metrics.
     */
    private function calculateProfitabilityMetrics(CarbonInterface $from, CarbonInterface $to): array
    {
        $operations = Operation::whereBetween('startdate', [$from, $to])->get();

        $totalRevenue = (float) $operations->sum('revenue');
        $totalCost = (float) $operations->sum('total_cost');
        $grossProfit = $totalRevenue - $totalCost;
        
        // Calculate indirect costs (administrative overhead - estimated at 15% of revenue if not tracked)
        $adminOverhead = $totalRevenue * 0.15;
        
        // EBITDA calculation (before depreciation and interest)
        $ebitda = $grossProfit - $adminOverhead;
        
        // Estimate depreciation (10% of fleet value per year, prorated)
        $fleetValue = (float) Truck::whereNotNull('purchasePrice')->sum('purchasePrice');
        $daysInPeriod = $from->diffInDays($to) + 1;
        $depreciation = ($fleetValue * 0.10) * ($daysInPeriod / 365);
        
        // EBIT (Operating Profit)
        $ebit = $ebitda - $depreciation;
        
        // Assume interest expense (5% of fleet value annually, prorated)
        $interestExpense = ($fleetValue * 0.05) * ($daysInPeriod / 365);
        
        // Net Profit
        $netProfit = $ebit - $interestExpense;
        
        // Calculate margins
        $grossProfitMargin = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : null;
        $ebitdaMargin = $totalRevenue > 0 ? ($ebitda / $totalRevenue) * 100 : null;
        $ebitMargin = $totalRevenue > 0 ? ($ebit / $totalRevenue) * 100 : null;
        $netProfitMargin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : null;
        
        // ROI and ROIC
        $averageAssets = $fleetValue; // Simplified - could include working capital
        $roi = $averageAssets > 0 ? ($netProfit / $averageAssets) * 100 : null;
        $roic = $averageAssets > 0 ? ($ebit / $averageAssets) * 100 : null;

        return [
            'total_revenue' => round($totalRevenue, 2),
            'total_cost' => round($totalCost, 2),
            'gross_profit' => round($grossProfit, 2),
            'gross_profit_margin' => $grossProfitMargin ? round($grossProfitMargin, 2) : null,
            'admin_overhead' => round($adminOverhead, 2),
            'ebitda' => round($ebitda, 2),
            'ebitda_margin' => $ebitdaMargin ? round($ebitdaMargin, 2) : null,
            'depreciation' => round($depreciation, 2),
            'ebit' => round($ebit, 2),
            'ebit_margin' => $ebitMargin ? round($ebitMargin, 2) : null,
            'interest_expense' => round($interestExpense, 2),
            'net_profit' => round($netProfit, 2),
            'net_profit_margin' => $netProfitMargin ? round($netProfitMargin, 2) : null,
            'roi' => $roi ? round($roi, 2) : null,
            'roic' => $roic ? round($roic, 2) : null,
        ];
    }

    /**
     * Calculate revenue breakdown metrics.
     */
    private function calculateRevenueMetrics(CarbonInterface $from, CarbonInterface $to): array
    {
        $truckCount = Truck::where('status', 'active')->count();
        $daysInPeriod = $from->diffInDays($to) + 1;

        $operations = Operation::whereBetween('startdate', [$from, $to])->get();
        $performances = Performance::whereBetween('DateDispach', [$from, $to])->get();

        $totalRevenue = (float) $operations->sum('revenue');
        $totalDistance = (float) $performances->sum(fn($p) => ($p->DistanceWCargo ?? 0) + ($p->DistanceWOCargo ?? 0));
        $totalTonKm = (float) $performances->sum('tonkm');
        
        // Revenue per truck per month
        $revenuePerTruckPerMonth = ($truckCount > 0 && $daysInPeriod > 0) 
            ? ($totalRevenue / $truckCount) * (30 / $daysInPeriod)
            : null;
        
        // Revenue per km
        $revenuePerKm = $totalDistance > 0 ? $totalRevenue / $totalDistance : null;
        
        // Revenue per ton-km
        $revenuePerTonKm = $totalTonKm > 0 ? $totalRevenue / $totalTonKm : null;
        
        // Revenue growth rate (compare with previous period)
        $previousPeriod = $this->getRevenueForPeriod(
            $from->copy()->subDays($daysInPeriod),
            $from->copy()->subDay()
        );
        $revenueGrowthRate = ($previousPeriod > 0) 
            ? (($totalRevenue - $previousPeriod) / $previousPeriod) * 100
            : null;

        // Revenue mix by service type (simplified)
        $internalRevenue = (float) $operations->where('is_outsource', false)->sum('revenue');
        $outsourceRevenue = (float) $operations->where('is_outsource', true)->sum('revenue');

        return [
            'total_revenue' => round($totalRevenue, 2),
            'revenue_per_truck_per_month' => $revenuePerTruckPerMonth ? round($revenuePerTruckPerMonth, 2) : null,
            'revenue_per_km' => $revenuePerKm ? round($revenuePerKm, 2) : null,
            'revenue_per_ton_km' => $revenuePerTonKm ? round($revenuePerTonKm, 2) : null,
            'revenue_growth_rate' => $revenueGrowthRate ? round($revenueGrowthRate, 2) : null,
            'internal_revenue' => round($internalRevenue, 2),
            'outsource_revenue' => round($outsourceRevenue, 2),
            'internal_revenue_percent' => $totalRevenue > 0 ? round(($internalRevenue / $totalRevenue) * 100, 2) : null,
            'outsource_revenue_percent' => $totalRevenue > 0 ? round(($outsourceRevenue / $totalRevenue) * 100, 2) : null,
        ];
    }

    /**
     * Calculate detailed cost structure.
     */
    private function calculateCostStructure(CarbonInterface $from, CarbonInterface $to): array
    {
        $performances = Performance::whereBetween('DateDispach', [$from, $to])->get();
        $operations = Operation::whereBetween('startdate', [$from, $to])->get();
        $maintenance = VehicleMaintenanceRecord::whereBetween('date_completed', [$from, $to])
            ->whereIn('status', ['completed', 'approved'])
            ->get();

        $totalRevenue = (float) $operations->sum('revenue');
        $totalDistance = (float) $performances->sum(fn($p) => ($p->DistanceWCargo ?? 0) + ($p->DistanceWOCargo ?? 0));

        // Fuel costs
        $fuelCost = (float) $performances->sum('fuelInBirr');
        
        // Labor costs (perdiem as proxy)
        $laborCost = (float) $performances->sum('PerDiem');
        
        // Maintenance costs
        $maintenanceCost = (float) $maintenance->sum('total_cost');
        
        // Other operational costs
        $workOnGoingCost = (float) $performances->sum('WorkOnGoing');
        $otherCost = (float) $performances->sum('OtherCost');
        
        // Outsource costs
        $outsourceCost = (float) $operations->where('is_outsource', true)->sum('outsource_cost');
        
        // Administrative overhead (estimated)
        $adminCost = $totalRevenue * 0.15;
        
        // Total costs
        $variableCost = $fuelCost + $laborCost + $workOnGoingCost + $otherCost + $outsourceCost;
        $fixedCost = $maintenanceCost + $adminCost;
        $totalCost = $variableCost + $fixedCost;

        // Cost per km breakdown
        $fuelCostPerKm = $totalDistance > 0 ? $fuelCost / $totalDistance : null;
        $laborCostPerKm = $totalDistance > 0 ? $laborCost / $totalDistance : null;
        $maintenanceCostPerKm = $totalDistance > 0 ? $maintenanceCost / $totalDistance : null;
        $totalCostPerKm = $totalDistance > 0 ? $totalCost / $totalDistance : null;

        // Cost as % of revenue
        $fuelCostPercent = $totalRevenue > 0 ? ($fuelCost / $totalRevenue) * 100 : null;
        $laborCostPercent = $totalRevenue > 0 ? ($laborCost / $totalRevenue) * 100 : null;
        $maintenanceCostPercent = $totalRevenue > 0 ? ($maintenanceCost / $totalRevenue) * 100 : null;
        $adminCostPercent = $totalRevenue > 0 ? ($adminCost / $totalRevenue) * 100 : null;

        // Variable vs Fixed ratio
        $variablePercent = $totalCost > 0 ? ($variableCost / $totalCost) * 100 : null;
        $fixedPercent = $totalCost > 0 ? ($fixedCost / $totalCost) * 100 : null;

        return [
            'fuel_cost' => round($fuelCost, 2),
            'labor_cost' => round($laborCost, 2),
            'maintenance_cost' => round($maintenanceCost, 2),
            'admin_cost' => round($adminCost, 2),
            'other_operational_cost' => round($workOnGoingCost + $otherCost, 2),
            'outsource_cost' => round($outsourceCost, 2),
            'variable_cost' => round($variableCost, 2),
            'fixed_cost' => round($fixedCost, 2),
            'total_cost' => round($totalCost, 2),
            'fuel_cost_per_km' => $fuelCostPerKm ? round($fuelCostPerKm, 2) : null,
            'labor_cost_per_km' => $laborCostPerKm ? round($laborCostPerKm, 2) : null,
            'maintenance_cost_per_km' => $maintenanceCostPerKm ? round($maintenanceCostPerKm, 2) : null,
            'total_cost_per_km' => $totalCostPerKm ? round($totalCostPerKm, 2) : null,
            'fuel_cost_percent' => $fuelCostPercent ? round($fuelCostPercent, 2) : null,
            'labor_cost_percent' => $laborCostPercent ? round($laborCostPercent, 2) : null,
            'maintenance_cost_percent' => $maintenanceCostPercent ? round($maintenanceCostPercent, 2) : null,
            'admin_cost_percent' => $adminCostPercent ? round($adminCostPercent, 2) : null,
            'variable_percent' => $variablePercent ? round($variablePercent, 2) : null,
            'fixed_percent' => $fixedPercent ? round($fixedPercent, 2) : null,
        ];
    }

    /**
     * Calculate cash flow and working capital metrics.
     */
    private function calculateCashFlowMetrics(CarbonInterface $from, CarbonInterface $to): array
    {
        $operations = Operation::whereBetween('startdate', [$from, $to])->get();
        $totalRevenue = (float) $operations->sum('revenue');
        $totalCost = (float) $operations->sum('total_cost');

        // Simplified cash flow (would need payment dates for accuracy)
        $operatingCashFlow = $totalRevenue - $totalCost;
        
        // Estimate DSO (Days Sales Outstanding) - assume 45 days average
        $dso = 45;
        
        // Estimate DPO (Days Payable Outstanding) - assume 30 days average
        $dpo = 30;
        
        // Cash Conversion Cycle
        $cashConversionCycle = $dso - $dpo;
        
        // Working capital needs (simplified)
        $daysInPeriod = $from->diffInDays($to) + 1;
        $dailyRevenue = $daysInPeriod > 0 ? $totalRevenue / $daysInPeriod : 0;
        $workingCapitalNeeds = $dailyRevenue * $cashConversionCycle;

        // Free Cash Flow (operating cash flow - capex estimate)
        $fleetValue = (float) Truck::whereNotNull('purchasePrice')->sum('purchasePrice');
        $estimatedCapex = ($fleetValue * 0.05) * ($daysInPeriod / 365); // 5% of fleet value annually
        $freeCashFlow = $operatingCashFlow - $estimatedCapex;

        return [
            'operating_cash_flow' => round($operatingCashFlow, 2),
            'free_cash_flow' => round($freeCashFlow, 2),
            'working_capital_needs' => round($workingCapitalNeeds, 2),
            'days_sales_outstanding' => $dso,
            'days_payable_outstanding' => $dpo,
            'cash_conversion_cycle' => $cashConversionCycle,
            'estimated_capex' => round($estimatedCapex, 2),
        ];
    }

    /**
     * Calculate capital efficiency metrics.
     */
    private function calculateCapitalEfficiency(CarbonInterface $from, CarbonInterface $to): array
    {
        $fleetValue = (float) Truck::whereNotNull('purchasePrice')->sum('purchasePrice');
        $truckCount = Truck::where('status', 'active')->count();
        
        $operations = Operation::whereBetween('startdate', [$from, $to])->get();
        $totalRevenue = (float) $operations->sum('revenue');
        
        $performances = Performance::whereBetween('DateDispach', [$from, $to])->get();
        $totalDistance = (float) $performances->sum(fn($p) => ($p->DistanceWCargo ?? 0) + ($p->DistanceWOCargo ?? 0));
        
        // Calculate active days for each truck
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
            ->count() * $from->diffInDays($to);
        
        $daysInPeriod = $from->diffInDays($to) + 1;
        $totalPossibleDays = $truckCount * $daysInPeriod;
        $fleetUtilization = $totalPossibleDays > 0 ? ($activeTruckDays / $totalPossibleDays) * 100 : null;
        
        // Asset turnover (revenue / assets)
        $assetTurnover = $fleetValue > 0 ? $totalRevenue / $fleetValue : null;
        
        // Revenue per asset
        $revenuePerAsset = $fleetValue > 0 ? $totalRevenue / $fleetValue : null;

        return [
            'fleet_value' => round($fleetValue, 2),
            'active_truck_count' => $truckCount,
            'fleet_utilization' => $fleetUtilization ? round($fleetUtilization, 2) : null,
            'asset_turnover_ratio' => $assetTurnover ? round($assetTurnover, 2) : null,
            'revenue_per_asset_birr' => $revenuePerAsset ? round($revenuePerAsset, 2) : null,
            'total_distance_km' => round($totalDistance, 2),
        ];
    }

    /**
     * Calculate 12-month rolling financial trends.
     */
    private function calculateFinancialTrends(CarbonInterface $from, CarbonInterface $to): array
    {
        // Get last 12 months of data
        $endDate = $to;
        $startDate = $endDate->copy()->subMonths(11)->startOfMonth();
        
        $trends = [];
        $currentMonth = $startDate->copy();
        
        while ($currentMonth <= $endDate) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();
            
            $operations = Operation::whereBetween('startdate', [$monthStart, $monthEnd])->get();
            $revenue = (float) $operations->sum('revenue');
            $cost = (float) $operations->sum('total_cost');
            $profit = $revenue - $cost;
            
            $trends[] = [
                'month' => $currentMonth->format('M Y'),
                'year' => (int) $currentMonth->year,
                'month_num' => (int) $currentMonth->month,
                'revenue' => round($revenue, 2),
                'cost' => round($cost, 2),
                'profit' => round($profit, 2),
                'margin' => $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null,
            ];
            
            $currentMonth->addMonth();
        }
        
        return $trends;
    }

    /**
     * Calculate monthly breakdown for the selected period.
     */
    private function calculateMonthlyBreakdown(CarbonInterface $from, CarbonInterface $to): array
    {
        $breakdown = [];
        $currentMonth = $from->copy()->startOfMonth();
        $endMonth = $to->copy()->endOfMonth();
        
        while ($currentMonth <= $endMonth) {
            $monthStart = $currentMonth->copy()->startOfMonth();
            $monthEnd = $currentMonth->copy()->endOfMonth();
            
            // Constrain to the actual date range
            if ($monthStart < $from) $monthStart = $from->copy();
            if ($monthEnd > $to) $monthEnd = $to->copy();
            
            $operations = Operation::whereBetween('startdate', [$monthStart, $monthEnd])->get();
            $performances = Performance::whereBetween('DateDispach', [$monthStart, $monthEnd])->get();
            
            $revenue = (float) $operations->sum('revenue');
            $cost = (float) $operations->sum('total_cost');
            $profit = $revenue - $cost;
            $trips = $performances->count();
            $distance = (float) $performances->sum(fn($p) => ($p->DistanceWCargo ?? 0) + ($p->DistanceWOCargo ?? 0));
            
            $breakdown[] = [
                'month' => $currentMonth->format('M Y'),
                'year' => (int) $currentMonth->year,
                'month_num' => (int) $currentMonth->month,
                'revenue' => round($revenue, 2),
                'cost' => round($cost, 2),
                'profit' => round($profit, 2),
                'margin' => $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null,
                'trips' => $trips,
                'distance_km' => round($distance, 2),
                'revenue_per_km' => $distance > 0 ? round($revenue / $distance, 2) : null,
                'cost_per_km' => $distance > 0 ? round($cost / $distance, 2) : null,
            ];
            
            $currentMonth->addMonth();
        }
        
        return $breakdown;
    }

    /**
     * Get revenue for a specific period (for growth calculation).
     */
    private function getRevenueForPeriod(CarbonInterface $from, CarbonInterface $to): float
    {
        return (float) Operation::whereBetween('startdate', [$from, $to])->sum('revenue');
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

