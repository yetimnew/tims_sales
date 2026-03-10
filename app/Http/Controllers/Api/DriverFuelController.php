<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelRecord;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DriverFuelController extends Controller
{
    /**
     * Get driver for authenticated user
     */
    private function getDriverForUser(User $user)
    {
        return $user->driver;
    }

    /**
     * Get fuel records for the authenticated driver
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'You are not registered as a driver.',
            ], 403);
        }

        // Get active truck assignment
        $activeAssignment = $driver->activeTruckAssignment()->first();

        if (! $activeAssignment) {
            return response()->json([
                'success' => true,
                'data' => [],
                'message' => 'No active truck assignment found.',
            ]);
        }

        // Get fuel records for this driver-truck assignment
        $query = FuelRecord::where('driver_truck_id', $activeAssignment->id)
            ->with(['driverTruck.truck'])
            ->orderByDesc('fuel_date')
            ->orderByDesc('created_at');

        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->where('fuel_date', '>=', $request->input('start_date'));
        }

        if ($request->has('end_date')) {
            $query->where('fuel_date', '<=', $request->input('end_date'));
        }

        // Limit results (default 50, max 100)
        $limit = min($request->input('limit', 50), 100);
        $fuelRecords = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'data' => $fuelRecords->map(function ($record) {
                return $this->formatFuelRecord($record);
            }),
            'count' => $fuelRecords->count(),
        ]);
    }

    /**
     * Get a specific fuel record
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'You are not registered as a driver.',
            ], 403);
        }

        $activeAssignment = $driver->activeTruckAssignment()->first();

        if (! $activeAssignment) {
            return response()->json([
                'success' => false,
                'message' => 'No active truck assignment found.',
            ], 404);
        }

        $fuelRecord = FuelRecord::where('id', $id)
            ->where('driver_truck_id', $activeAssignment->id)
            ->with(['driverTruck.truck'])
            ->first();

        if (! $fuelRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Fuel record not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatFuelRecord($fuelRecord),
        ]);
    }

    /**
     * Create a new fuel record
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'You are not registered as a driver.',
            ], 403);
        }

        $activeAssignment = $driver->activeTruckAssignment()->first();

        if (! $activeAssignment) {
            return response()->json([
                'success' => false,
                'message' => 'No active truck assignment found. You must have an active truck assignment to record fuel.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'fuel_date' => 'required|date|before_or_equal:today',
            'fuel_quantity_liters' => 'required|numeric|min:0.01|max:999999.99',
            'fuel_price_per_liter' => 'required|numeric|min:0.01|max:999999.99',
            'total_cost' => 'required|numeric|min:0.01|max:999999999.99',
            'fuel_station' => 'required|string|max:255',
            'fuel_type' => 'required|in:diesel,petrol,gas',
            'odometer_reading' => 'nullable|integer|min:0|max:9999999',
            'receipt_number' => 'nullable|string|max:255|unique:fuel_records,receipt_number',
            'notes' => 'nullable|string|max:1000',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'location_accuracy_m' => 'nullable|numeric|min:0|max:99999.99',
            'location_timestamp' => 'nullable|date',
            'receipt_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // Calculate total cost if not provided or verify it matches calculation
        $calculatedTotal = $validated['fuel_quantity_liters'] * $validated['fuel_price_per_liter'];
        if (abs($validated['total_cost'] - $calculatedTotal) > 0.01) {
            return response()->json([
                'success' => false,
                'message' => 'Total cost does not match the calculation (quantity × price per liter).',
            ], 422);
        }

        $latestOdometerRecord = FuelRecord::query()
            ->where('driver_truck_id', $activeAssignment->id)
            ->whereNotNull('odometer_reading')
            ->orderByDesc('fuel_date')
            ->orderByDesc('created_at')
            ->first();

        if (
            isset($validated['odometer_reading']) &&
            $latestOdometerRecord !== null &&
            $validated['odometer_reading'] < $latestOdometerRecord->odometer_reading
        ) {
            return response()->json([
                'success' => false,
                'message' => sprintf(
                    'Odometer reading cannot be lower than the last recorded value (%d km).',
                    $latestOdometerRecord->odometer_reading
                ),
                'errors' => [
                    'odometer_reading' => [
                        sprintf('Latest recorded odometer is %d km.', $latestOdometerRecord->odometer_reading),
                    ],
                ],
            ], 422);
        }

        try {
            $receiptImagePath = null;

            if ($request->hasFile('receipt_image')) {
                $receiptImagePath = $request->file('receipt_image')->store('fuel-receipts', 'public');
            }

            // Create fuel record
            $fuelRecord = FuelRecord::create([
                'driver_truck_id' => $activeAssignment->id,
                'truck_id' => $activeAssignment->truck_id,
                'driver_id' => $driver->id,
                'user_id' => $user->id,
                'fuel_date' => $validated['fuel_date'],
                'fuel_quantity_liters' => $validated['fuel_quantity_liters'],
                'fuel_price_per_liter' => $validated['fuel_price_per_liter'],
                'total_cost' => $validated['total_cost'],
                'fuel_station' => $validated['fuel_station'],
                'fuel_type' => $validated['fuel_type'],
                'odometer_reading' => $validated['odometer_reading'] ?? null,
                'receipt_number' => $validated['receipt_number'] ?? null,
                'receipt_image_path' => $receiptImagePath,
                'notes' => $validated['notes'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'location_accuracy_m' => $validated['location_accuracy_m'] ?? null,
                'location_timestamp' => $validated['location_timestamp'] ?? now(),
                'submitted_via_mobile' => true,
            ]);

            // Load relationships
            $fuelRecord->load(['driverTruck.truck']);

            return response()->json([
                'success' => true,
                'message' => 'Fuel record created successfully.',
                'data' => $this->formatFuelRecord($fuelRecord),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create fuel record. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Format fuel record for API response
     */
    private function formatFuelRecord(FuelRecord $record): array
    {
        return [
            'id' => $record->id,
            'fuel_date' => $record->fuel_date->toDateString(),
            'fuel_quantity_liters' => (float) $record->fuel_quantity_liters,
            'fuel_price_per_liter' => (float) $record->fuel_price_per_liter,
            'total_cost' => (float) $record->total_cost,
            'fuel_station' => $record->fuel_station,
            'fuel_type' => $record->fuel_type,
            'odometer_reading' => $record->odometer_reading,
            'receipt_number' => $record->receipt_number,
            'receipt_image' => $record->receipt_image_url,
            'notes' => $record->notes,
            'latitude' => $record->latitude !== null ? (float) $record->latitude : null,
            'longitude' => $record->longitude !== null ? (float) $record->longitude : null,
            'location_accuracy_m' => $record->location_accuracy_m !== null ? (float) $record->location_accuracy_m : null,
            'location_timestamp' => $record->location_timestamp?->toIso8601String(),
            'submitted_via_mobile' => (bool) $record->submitted_via_mobile,
            'reviewed_at' => $record->reviewed_at?->toIso8601String(),
            'review_note' => $record->review_note,
            'truck' => $record->driverTruck && $record->driverTruck->truck ? [
                'id' => $record->driverTruck->truck->id,
                'plate' => $record->driverTruck->truck->plate,
            ] : null,
            'created_at' => $record->created_at->toIso8601String(),
            'updated_at' => $record->updated_at->toIso8601String(),
        ];
    }
}
