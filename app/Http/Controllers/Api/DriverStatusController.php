<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\DriverStatusHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DriverStatusController extends Controller
{
    /**
     * Get the driver associated with the authenticated user
     * Uses the User->Driver relationship (user_id in drivers table)
     * Returns null if user is not a driver
     */
    private function getDriverForUser($user)
    {
        // Use the User->Driver relationship via user_id
        return $user->driver;
    }

    /**
     * Update driver status
     * If no status exists for today, uses driver's current status field as fallback
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status_type' => 'required|string|in:work,truck,trip',
            'status_value' => 'required|string',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found. Please contact administrator to link your account to a driver record.',
            ], 404);
        }

        // Get the status value - use provided value or fallback to driver's status field
        $statusValue = $request->status_value;
        
        // If status_value is empty or not provided, use driver's current status field
        if (empty($statusValue) && $request->status_type === 'work') {
            $statusValue = $driver->status ?? 'active';
        }

        // Check if a status exists for today (same status_type)
        // Look for status created today (within the same day)
        $today = now()->format('Y-m-d');
        $existingStatus = DriverStatusHistory::where('driver_id', $driver->id)
            ->where('status_type', $request->status_type)
            ->whereDate('created_at', $today)
            ->first();

        if ($existingStatus) {
            // Update existing status for today
            $existingStatus->update([
                'status_value' => $statusValue,
                'notes' => $request->notes,
            ]);
            $statusHistory = $existingStatus->fresh();
        } else {
            // Create new status history record
            $statusHistory = DriverStatusHistory::create([
                'driver_id' => $driver->id,
                'status_type' => $request->status_type,
                'status_value' => $statusValue,
                'notes' => $request->notes,
            ]);
        }

        // Update driver's current status field if it's a work status
        if ($request->status_type === 'work') {
            $driver->update(['status' => $statusValue]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
            'data' => [
                'id' => $statusHistory->id,
                'status_type' => $statusHistory->status_type,
                'status_value' => $statusHistory->status_value,
                'notes' => $statusHistory->notes,
                'created_at' => $statusHistory->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get current driver status (latest work status)
     * If no status history exists, falls back to driver's status field from drivers table
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found.',
                'data' => null,
            ], 404);
        }

        $currentStatus = DriverStatusHistory::where('driver_id', $driver->id)
            ->where('status_type', 'work')
            ->orderByDesc('created_at')
            ->first();

        // If no status history exists, use driver's current status field
        if (!$currentStatus) {
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => null,
                    'status_type' => 'work',
                    'status_value' => $driver->status ?? 'active', // Use driver's status field
                    'notes' => null,
                    'created_at' => $driver->updated_at?->toIso8601String() ?? now()->toIso8601String(),
                    'is_default' => true, // Flag to indicate this is from driver's status field
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $currentStatus->id,
                'status_type' => $currentStatus->status_type,
                'status_value' => $currentStatus->status_value,
                'notes' => $currentStatus->notes,
                'created_at' => $currentStatus->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get driver status history
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found.',
                'data' => [],
            ], 404);
        }

        $statusType = $request->query('status_type'); // Optional filter
        $limit = min((int) $request->query('limit', 50), 100);

        $query = DriverStatusHistory::where('driver_id', $driver->id)
            ->orderByDesc('created_at')
            ->limit($limit);

        if ($statusType) {
            $query->where('status_type', $statusType);
        }

        $history = $query->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'status_type' => $item->status_type,
                'status_value' => $item->status_value,
                'notes' => $item->notes,
                'created_at' => $item->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }
}
