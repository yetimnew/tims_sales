<?php

namespace App\Support;

use App\Models\Performance;
use Exception;
use Illuminate\Support\Carbon;

class PerformanceRecordPresenter
{
    public static function present(Performance $performance): array
    {
        $distanceWithCargo = $performance->DistanceWCargo !== null ? (float) $performance->DistanceWCargo : null;
        $distanceWithoutCargo = $performance->DistanceWOCargo !== null ? (float) $performance->DistanceWOCargo : null;
        $totalTripDistance = null;

        if ($distanceWithCargo !== null || $distanceWithoutCargo !== null) {
            $totalTripDistance = ($distanceWithCargo ?? 0.0) + ($distanceWithoutCargo ?? 0.0);
        }

        $dispatchDate = self::toCarbon($performance->DateDispach);
        $returnedDate = self::toCarbon($performance->returned_date);

        $tripDurationDays = null;

        if ($dispatchDate && $returnedDate) {
            $tripDurationDays = $dispatchDate->diffInDays($returnedDate);
        }

        $cargoWeightKg = $performance->cargo_weight_kg !== null ? (float) $performance->cargo_weight_kg : null;
        $cargoWeightTons = $cargoWeightKg !== null ? round($cargoWeightKg / 1000, 2) : null;

        return [
            'id' => $performance->id,
            'driver_truck_id' => $performance->driver_truck_id,
            'DateDispach' => $dispatchDate?->toDateString(),
            'DistanceWCargo' => $distanceWithCargo,
            'DistanceWOCargo' => $distanceWithoutCargo,
            'fuelInLitter' => $performance->fuelInLitter !== null ? (float) $performance->fuelInLitter : null,
            'fuelInBirr' => $performance->fuelInBirr !== null ? (float) $performance->fuelInBirr : null,
            'comment' => $performance->comment,
            'load_phase' => $performance->load_phase,
            'satus' => $performance->satus,
            'tonkm' => $performance->tonkm !== null ? (float) $performance->tonkm : null,
            'cargo_volume_mt' => $performance->CargoVolumMT !== null ? (float) $performance->CargoVolumMT : null,
            'cargo_weight_kg' => $cargoWeightKg,
            'cargo_weight_tons' => $cargoWeightTons,
            'is_returned' => (bool) $performance->is_returned,
            'returned_date' => $returnedDate?->toDateString(),
            'total_distance_km' => $totalTripDistance !== null ? round($totalTripDistance, 2) : null,
            'trip_duration_days' => $tripDurationDays,
            'driver_truck' => $performance->driverTruck ? [
                'id' => $performance->driverTruck->id,
                'plate' => $performance->driverTruck->truck?->plate ?? $performance->driverTruck->plate,
                'status' => $performance->driverTruck->status,
                'is_attached' => (bool) $performance->driverTruck->is_attached,
                'date_recived' => self::toCarbon($performance->driverTruck->date_recived)?->toDateString(),
                'date_detach' => self::toCarbon($performance->driverTruck->date_detach)?->toDateString(),
                'driver' => $performance->driverTruck->driver ? [
                    'id' => $performance->driverTruck->driver->id,
                    'name' => $performance->driverTruck->driver->name,
                    'driverid' => $performance->driverTruck->driver->driverid,
                ] : null,
                'truck' => $performance->driverTruck->truck ? [
                    'id' => $performance->driverTruck->truck->id,
                    'plate' => $performance->driverTruck->truck->plate,
                ] : null,
            ] : null,
            'origin' => $performance->origin ? [
                'id' => $performance->origin->id,
                'name' => $performance->origin->name,
            ] : null,
            'destination' => $performance->destination ? [
                'id' => $performance->destination->id,
                'name' => $performance->destination->name,
            ] : null,
            'operation' => $performance->operation ? [
                'id' => $performance->operation->id,
                'number' => $performance->operation->operationid ?? null,
                'status' => $performance->operation->status ?? null,
            ] : null,
        ];
    }

    private static function toCarbon(null|string|Carbon $value): ?Carbon
    {
        if ($value instanceof Carbon) {
            return $value;
        }

        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (Exception) {
            return null;
        }
    }
}
