<?php

namespace App\Services\Reports;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TruckPerformanceReport
{
    /**
     * Build the truck performance report payload.
     */
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $truckIds = $this->resolveTruckIds($filters);
        $vehicleTypeIds = $this->resolveVehicleTypeIds($filters);
        $statuses = $this->resolveStatuses($filters);

        $rows = $this->runQuery($from, $to, $truckIds, $vehicleTypeIds, $statuses);

        $summary = $this->summarise($rows);

        return [
            'rows' => $rows,
            'summary' => $summary,
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
        ];
    }

    private function resolveDateRange(array $filters): array
    {
        $from = $filters['from'] ?? now()->subMonthsNoOverflow(1)->toDateString();
        $to = $filters['to'] ?? now()->toDateString();

        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        if ($fromDate->greaterThan($toDate)) {
            [$fromDate, $toDate] = [$toDate->copy()->startOfDay(), $fromDate->copy()->endOfDay()];
        }

        return [$fromDate, $toDate];
    }

    private function resolveTruckIds(array $filters): array
    {
        $ids = Arr::wrap($filters['truck_ids'] ?? $filters['truck_id'] ?? []);

        return collect($ids)
            ->filter(static fn ($value) => $value !== null && $value !== '')
            ->map(static fn ($value) => (int) $value)
            ->filter(static fn ($value) => $value > 0)
            ->unique()
            ->values()
            ->all();
    }

    private function runQuery(CarbonInterface $from, CarbonInterface $to, array $truckIds, array $vehicleTypeIds, array $statuses): Collection
    {
        $query = DB::table('performances')
            ->selectRaw('driver_truck.truck_id as truck_id')
            ->selectRaw('MAX(trucks.plate) as plate')
            ->selectRaw('MAX(trucks.status) as status')
            ->selectRaw('MAX(vehicletypes.name) as vehicle_type')
            ->selectRaw('COUNT(performances.FOnumber) as trips')
            ->selectRaw('SUM(COALESCE(performances.CargoVolumMT, 0)) as tonnage')
            ->selectRaw('SUM(COALESCE(performances.tonkm, 0)) as ton_km')
            ->selectRaw('SUM(COALESCE(performances.DistanceWCargo, 0)) as distance_wc')
            ->selectRaw('SUM(COALESCE(performances.DistanceWOCargo, 0)) as distance_wo')
            ->selectRaw('SUM(COALESCE(performances.fuelInLitter, 0)) as fuel_litres')
            ->selectRaw('SUM(COALESCE(performances.fuelInBirr, 0)) as fuel_cost')
            ->selectRaw('SUM(COALESCE(performances.perdiem, 0)) as perdiem')
            ->selectRaw('SUM(COALESCE(performances.workOnGoing, 0)) as work_on_going')
            ->selectRaw('SUM(COALESCE(performances.other, 0)) as other_cost')
            ->selectRaw('SUM(COALESCE(performances.tonkm, 0) * COALESCE(operations.tariff, 0)) as revenue')
            ->leftJoin('driver_truck', 'driver_truck.id', '=', 'performances.driver_truck_id')
            ->leftJoin('trucks', 'trucks.id', '=', 'driver_truck.truck_id')
            ->leftJoin('vehicletypes', 'vehicletypes.id', '=', 'trucks.vehicletype_id')
            ->leftJoin('operations', 'operations.id', '=', 'performances.operation_id')
            ->whereBetween('performances.DateDispach', [$from->toDateTimeString(), $to->toDateTimeString()])
            ->groupBy('driver_truck.truck_id');

        if (! empty($truckIds)) {
            $query->whereIn('driver_truck.truck_id', $truckIds);
        }

        if (! empty($vehicleTypeIds)) {
            $query->whereIn('trucks.vehicletype_id', $vehicleTypeIds);
        }

        if (! empty($statuses)) {
            $query->whereIn('trucks.status', $statuses);
        }

        return collect($query->orderByDesc('trips')->get())->map(function ($row) {
            $distanceTotal = (float) $row->distance_wc + (float) $row->distance_wo;
            $totalExpense = (float) $row->fuel_cost + (float) $row->perdiem + (float) $row->work_on_going + (float) $row->other_cost;
            $profit = (float) $row->revenue - $totalExpense;
            $margin = ((float) $row->revenue) > 0 ? round(($profit / (float) $row->revenue) * 100, 2) : null;

            return [
                'truck_id' => (int) $row->truck_id,
                'plate' => $row->plate ?? '—',
                'trips' => (int) $row->trips,
                'tonnage' => round((float) $row->tonnage, 2),
                'ton_km' => round((float) $row->ton_km, 2),
                'distance_wc' => round((float) $row->distance_wc, 2),
                'distance_wo' => round((float) $row->distance_wo, 2),
                'distance_total' => round($distanceTotal, 2),
                'fuel_litres' => round((float) $row->fuel_litres, 2),
                'fuel_cost' => round((float) $row->fuel_cost, 2),
                'perdiem' => round((float) $row->perdiem, 2),
                'work_on_going' => round((float) $row->work_on_going, 2),
                'other_cost' => round((float) $row->other_cost, 2),
                'expense' => round($totalExpense, 2),
                'revenue' => round((float) $row->revenue, 2),
                'profit' => round($profit, 2),
                'margin_percent' => $margin,
                'truck_status' => $row->status ? (string) $row->status : null,
                'vehicle_type' => $row->vehicle_type ? (string) $row->vehicle_type : null,
            ];
        });
    }

    private function resolveVehicleTypeIds(array $filters): array
    {
        $ids = Arr::wrap($filters['vehicle_type_ids'] ?? []);

        return collect($ids)
            ->filter(static fn ($value) => $value !== null && $value !== '')
            ->map(static fn ($value) => (int) $value)
            ->filter(static fn ($value) => $value > 0)
            ->unique()
            ->values()
            ->all();
    }

    private function resolveStatuses(array $filters): array
    {
        $statuses = Arr::wrap($filters['statuses'] ?? []);

        return collect($statuses)
            ->map(static fn ($value) => trim((string) $value))
            ->filter(static fn ($value) => $value !== '')
            ->unique()
            ->values()
            ->all();
    }

    private function summarise(Collection $rows): array
    {
        $summary = [
            'trips' => 0,
            'tonnage' => 0.0,
            'ton_km' => 0.0,
            'distance_wc' => 0.0,
            'distance_wo' => 0.0,
            'distance_total' => 0.0,
            'fuel_litres' => 0.0,
            'fuel_cost' => 0.0,
            'perdiem' => 0.0,
            'work_on_going' => 0.0,
            'other_cost' => 0.0,
            'expense' => 0.0,
            'revenue' => 0.0,
            'profit' => 0.0,
        ];

        foreach ($rows as $row) {
            $summary['trips'] += $row['trips'];
            $summary['tonnage'] += $row['tonnage'];
            $summary['ton_km'] += $row['ton_km'];
            $summary['distance_wc'] += $row['distance_wc'];
            $summary['distance_wo'] += $row['distance_wo'];
            $summary['distance_total'] += $row['distance_total'];
            $summary['fuel_litres'] += $row['fuel_litres'];
            $summary['fuel_cost'] += $row['fuel_cost'];
            $summary['perdiem'] += $row['perdiem'];
            $summary['work_on_going'] += $row['work_on_going'];
            $summary['other_cost'] += $row['other_cost'];
            $summary['revenue'] += $row['revenue'];
            $summary['expense'] += $row['expense'];
            $summary['profit'] += $row['profit'];
        }

        $summary['tonnage'] = round($summary['tonnage'], 2);
        $summary['ton_km'] = round($summary['ton_km'], 2);
        $summary['distance_wc'] = round($summary['distance_wc'], 2);
        $summary['distance_wo'] = round($summary['distance_wo'], 2);
        $summary['distance_total'] = round($summary['distance_total'], 2);
        $summary['fuel_litres'] = round($summary['fuel_litres'], 2);
        $summary['fuel_cost'] = round($summary['fuel_cost'], 2);
        $summary['perdiem'] = round($summary['perdiem'], 2);
        $summary['work_on_going'] = round($summary['work_on_going'], 2);
        $summary['other_cost'] = round($summary['other_cost'], 2);
        $summary['revenue'] = round($summary['revenue'], 2);
        $summary['expense'] = round($summary['expense'], 2);
        $summary['profit'] = round($summary['profit'], 2);
        $summary['margin_percent'] = $summary['revenue'] > 0
            ? round(($summary['profit'] / $summary['revenue']) * 100, 2)
            : null;

        return $summary;
    }
}
