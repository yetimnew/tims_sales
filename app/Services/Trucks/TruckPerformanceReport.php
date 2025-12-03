<?php

namespace App\Services\Trucks;

use App\Models\Performance;
use App\Models\Truck;
use App\Services\Trucks\Data\TruckPerformanceSummary;

class TruckPerformanceReport
{
    public function build(Truck $truck): TruckPerformanceSummary
    {
        $performanceQuery = $truck->performances();

        $recentRecords = (clone $performanceQuery)
            ->with([
                'origin:id,name',
                'destination:id,name',
            ])
            ->orderByDesc('performances.DateDispach')
            ->orderByDesc('performances.created_at')
            ->limit(10)
            ->get([
                'performances.id',
                'performances.driver_truck_id',
                'performances.DateDispach',
                'performances.DistanceWCargo',
                'performances.DistanceWOCargo',
                'performances.fuelInLitter',
                'performances.fuelInBirr',
                'performances.load_phase',
                'performances.comment',
                'performances.satus',
                'performances.tonkm',
                'performances.CargoVolumMT',
                'performances.cargo_weight_kg',
                'performances.is_returned',
                'performances.returned_date',
            ])
            ->map(function (Performance $performance): array {
                $distanceWithCargo = $performance->DistanceWCargo !== null ? (float) $performance->DistanceWCargo : null;
                $distanceWithoutCargo = $performance->DistanceWOCargo !== null ? (float) $performance->DistanceWOCargo : null;
                $totalTripDistance = null;

                if ($distanceWithCargo !== null || $distanceWithoutCargo !== null) {
                    $totalTripDistance = ($distanceWithCargo ?? 0.0) + ($distanceWithoutCargo ?? 0.0);
                }

                $tripDurationDays = null;

                if ($performance->DateDispach && $performance->returned_date) {
                    $tripDurationDays = $performance->DateDispach->diffInDays($performance->returned_date);
                }

                return [
                    'id' => $performance->id,
                    'driver_truck_id' => $performance->driver_truck_id,
                    'DateDispach' => $performance->DateDispach?->toDateString(),
                    'DistanceWCargo' => $distanceWithCargo,
                    'DistanceWOCargo' => $distanceWithoutCargo,
                    'fuelInLitter' => $performance->fuelInLitter !== null ? (float) $performance->fuelInLitter : null,
                    'fuelInBirr' => $performance->fuelInBirr !== null ? (float) $performance->fuelInBirr : null,
                    'load_phase' => $performance->load_phase,
                    'comment' => $performance->comment,
                    'satus' => $performance->satus,
                    'tonkm' => $performance->tonkm !== null ? (float) $performance->tonkm : null,
                    'cargo_volume_mt' => $performance->CargoVolumMT !== null ? (float) $performance->CargoVolumMT : null,
                    'cargo_weight_kg' => $performance->cargo_weight_kg !== null ? (float) $performance->cargo_weight_kg : null,
                    'cargo_weight_tons' => $performance->cargo_weight_kg !== null
                        ? round((float) $performance->cargo_weight_kg / 1000, 2)
                        : null,
                    'is_returned' => (bool) $performance->is_returned,
                    'returned_date' => $performance->returned_date?->toDateString(),
                    'total_distance_km' => $totalTripDistance !== null ? round($totalTripDistance, 2) : null,
                    'trip_duration_days' => $tripDurationDays,
                    'origin' => $performance->origin ? [
                        'id' => $performance->origin->id,
                        'name' => $performance->origin->name,
                    ] : null,
                    'destination' => $performance->destination ? [
                        'id' => $performance->destination->id,
                        'name' => $performance->destination->name,
                    ] : null,
                ];
            })
            ->values()
            ->all();

        $distanceWithCargoSum = (float) ((clone $performanceQuery)->sum('DistanceWCargo') ?? 0);
        $distanceWithoutCargoSum = (float) ((clone $performanceQuery)->sum('DistanceWOCargo') ?? 0);
        $totalDistance = round($distanceWithCargoSum + $distanceWithoutCargoSum, 2);
        $totalFuel = (float) ((clone $performanceQuery)->sum('fuelInLitter') ?? 0);
        $totalFuelCost = (float) ((clone $performanceQuery)->sum('fuelInBirr') ?? 0);
        $totalPerformanceRecords = (clone $performanceQuery)->count();
        $completedTrips = (clone $performanceQuery)->where('is_returned', true)->count();
        $openTrips = (clone $performanceQuery)
            ->where(function ($query): void {
                $query->whereNull('is_returned')
                    ->orWhere('is_returned', false);
            })
            ->count();
        $mainTripCount = (clone $performanceQuery)->where('load_phase', 'main')->count();
        $tonKilometerSum = (float) ((clone $performanceQuery)->sum('tonkm') ?? 0);
        $cargoWeightKgSum = (float) ((clone $performanceQuery)->sum('cargo_weight_kg') ?? 0);
        $cargoVolumeSum = (float) ((clone $performanceQuery)->sum('CargoVolumMT') ?? 0);

        $durationSamples = (clone $performanceQuery)
            ->where('is_returned', true)
            ->whereNotNull('DateDispach')
            ->whereNotNull('returned_date')
            ->get(['DateDispach', 'returned_date']);

        $durationTotalDays = 0.0;
        $durationCount = 0;

        foreach ($durationSamples as $sample) {
            if ($sample->DateDispach && $sample->returned_date) {
                $durationTotalDays += $sample->DateDispach->diffInDays($sample->returned_date);
                $durationCount++;
            }
        }

        $avgTripDurationDays = $durationCount > 0 ? round($durationTotalDays / $durationCount, 2) : null;
        $avgLoadedDistance = $mainTripCount > 0 ? round($distanceWithCargoSum / $mainTripCount, 2) : null;
        $avgEmptyDistance = $mainTripCount > 0 ? round($distanceWithoutCargoSum / $mainTripCount, 2) : null;
        $payloadTonsSum = round($cargoWeightKgSum / 1000, 2);

        $summary = [
            'total_records' => $totalPerformanceRecords,
            'main_trip_records' => $mainTripCount,
            'completed_trips' => $completedTrips,
            'open_trips' => $openTrips,
            'total_distance_km' => $totalDistance,
            'total_loaded_distance_km' => round($distanceWithCargoSum, 2),
            'total_empty_distance_km' => round($distanceWithoutCargoSum, 2),
            'total_fuel_liters' => round($totalFuel, 2),
            'fuel_cost_birr' => round($totalFuelCost, 2),
            'avg_distance_per_record' => $totalPerformanceRecords > 0 ? round($totalDistance / $totalPerformanceRecords, 2) : 0.0,
            'avg_trip_distance_km' => $totalPerformanceRecords > 0 ? round($totalDistance / $totalPerformanceRecords, 2) : 0.0,
            'avg_loaded_distance_km' => $avgLoadedDistance,
            'avg_empty_distance_km' => $avgEmptyDistance,
            'avg_fuel_efficiency_km_per_liter' => $totalFuel > 0 ? round($totalDistance / $totalFuel, 2) : null,
            'avg_trip_duration_days' => $avgTripDurationDays,
            'total_ton_km' => round($tonKilometerSum, 2),
            'avg_ton_km_per_trip' => $mainTripCount > 0 ? round($tonKilometerSum / $mainTripCount, 2) : null,
            'total_payload_tons' => $payloadTonsSum,
            'avg_payload_tons_per_trip' => $mainTripCount > 0 && $payloadTonsSum > 0 ? round($payloadTonsSum / $mainTripCount, 2) : null,
            'total_cargo_volume_mt' => round($cargoVolumeSum, 2),
            'avg_cargo_volume_mt_per_trip' => $mainTripCount > 0 && $cargoVolumeSum > 0 ? round($cargoVolumeSum / $mainTripCount, 2) : null,
            'trip_completion_rate' => $totalPerformanceRecords > 0 ? round($completedTrips / $totalPerformanceRecords, 4) : null,
        ];

        return new TruckPerformanceSummary($recentRecords, $summary);
    }
}
