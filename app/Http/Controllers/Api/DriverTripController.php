<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverTruck;
use App\Models\Performance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DriverTripController extends Controller
{
    /**
     * Get driver trips (current/upcoming)
     */
    public function index(Request $request): JsonResponse
    {
        $driver = $request->user();

        // Get active truck assignment
        $activeAssignment = DriverTruck::where('driver_id', $driver->id)
            ->where('status', 'active')
            ->whereNull('unassigned_date')
            ->first();

        if (!$activeAssignment) {
            return response()->json([
                'success' => true,
                'data' => [
                    'current' => null,
                    'upcoming' => [],
                ],
            ]);
        }

        // Get current/active trips
        $currentTrips = Performance::where('driver_truck_id', $activeAssignment->id)
            ->where('satus', 'active')
            ->where('is_returned', false)
            ->with(['origin', 'destination', 'operation', 'cargoType'])
            ->orderByDesc('DateDispach')
            ->get()
            ->map(function ($trip) {
                return $this->formatTrip($trip);
            });

        // Get upcoming trips (scheduled for future)
        $upcomingTrips = Performance::where('driver_truck_id', $activeAssignment->id)
            ->where('satus', 'open')
            ->where('DateDispach', '>', now())
            ->with(['origin', 'destination', 'operation', 'cargoType'])
            ->orderBy('DateDispach')
            ->limit(10)
            ->get()
            ->map(function ($trip) {
                return $this->formatTrip($trip);
            });

        return response()->json([
            'success' => true,
            'data' => [
                'current' => $currentTrips->first(), // Most recent active trip
                'upcoming' => $upcomingTrips,
            ],
        ]);
    }

    /**
     * Get trip details
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $driver = $request->user();

        // Verify trip belongs to driver's active assignment
        $activeAssignment = DriverTruck::where('driver_id', $driver->id)
            ->where('status', 'active')
            ->whereNull('unassigned_date')
            ->first();

        if (!$activeAssignment) {
            return response()->json([
                'success' => false,
                'message' => 'No active truck assignment',
            ], 404);
        }

        $trip = Performance::where('id', $id)
            ->where('driver_truck_id', $activeAssignment->id)
            ->with(['origin', 'destination', 'operation', 'cargoType'])
            ->first();

        if (!$trip) {
            return response()->json([
                'success' => false,
                'message' => 'Trip not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatTrip($trip, true),
        ]);
    }

    /**
     * Update trip status
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:active,completed,cancelled',
            'comment' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $driver = $request->user();

        // Verify trip belongs to driver's active assignment
        $activeAssignment = DriverTruck::where('driver_id', $driver->id)
            ->where('status', 'active')
            ->whereNull('unassigned_date')
            ->first();

        if (!$activeAssignment) {
            return response()->json([
                'success' => false,
                'message' => 'No active truck assignment',
            ], 404);
        }

        $trip = Performance::where('id', $id)
            ->where('driver_truck_id', $activeAssignment->id)
            ->first();

        if (!$trip) {
            return response()->json([
                'success' => false,
                'message' => 'Trip not found',
            ], 404);
        }

        $trip->update([
            'satus' => $request->status,
            'comment' => $request->comment ?? $trip->comment,
        ]);

        if ($request->status === 'completed') {
            $trip->update([
                'is_returned' => true,
                'returned_date' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Trip updated successfully',
            'data' => $this->formatTrip($trip->fresh(['origin', 'destination', 'operation', 'cargoType']), true),
        ]);
    }

    /**
     * Format trip data
     */
    private function formatTrip(Performance $trip, bool $detailed = false): array
    {
        $data = [
            'id' => $trip->id,
            'FOnumber' => $trip->FOnumber,
            'load_phase' => $trip->load_phase,
            'load_completion' => $trip->load_completion,
            'status' => $trip->satus,
            'is_returned' => $trip->is_returned,
            'dispatch_date' => $trip->DateDispach?->toIso8601String(),
            'returned_date' => $trip->returned_date?->toIso8601String(),
            'origin' => $trip->origin ? [
                'id' => $trip->origin->id,
                'name' => $trip->origin->name,
            ] : null,
            'destination' => $trip->destination ? [
                'id' => $trip->destination->id,
                'name' => $trip->destination->name,
            ] : null,
        ];

        if ($detailed) {
            $data = array_merge($data, [
                'distance_with_cargo' => $trip->DistanceWCargo ? (float) $trip->DistanceWCargo : null,
                'distance_without_cargo' => $trip->DistanceWOCargo ? (float) $trip->DistanceWOCargo : null,
                'cargo_volume_mt' => $trip->CargoVolumMT ? (float) $trip->CargoVolumMT : null,
                'cargo_weight_kg' => $trip->cargo_weight_kg ? (float) $trip->cargo_weight_kg : null,
                'cargo_volume_cubic_meters' => $trip->cargo_volume_cubic_meters ? (float) $trip->cargo_volume_cubic_meters : null,
                'fuel_liters' => $trip->fuelInLitter ? (float) $trip->fuelInLitter : null,
                'fuel_birr' => $trip->fuelInBirr ? (float) $trip->fuelInBirr : null,
                'comment' => $trip->comment,
                'cargo_type' => $trip->cargoType ? [
                    'id' => $trip->cargoType->id,
                    'name' => $trip->cargoType->name,
                ] : null,
                'operation' => $trip->operation ? [
                    'id' => $trip->operation->id,
                    'name' => $trip->operation->name,
                ] : null,
            ]);
        }

        return $data;
    }
}
