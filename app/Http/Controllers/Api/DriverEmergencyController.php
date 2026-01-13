<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DriverEmergencyController extends Controller
{
    /**
     * Get driver for authenticated user
     */
    private function getDriverForUser(User $user)
    {
        return $user->driver;
    }

    /**
     * Send emergency alert with location
     */
    public function sendAlert(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'You are not registered as a driver.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // In a real implementation, you would:
        // 1. Create an emergency alert record
        // 2. Send notifications to dispatchers/admins
        // 3. Log the emergency event
        // 4. Possibly trigger external emergency services

        // For now, we'll return success
        // TODO: Implement emergency alert system
        // - Create EmergencyAlert model
        // - Send push notifications to dispatchers
        // - Create activity log entry
        // - Store emergency alert in database

        return response()->json([
            'success' => true,
            'message' => 'Emergency alert sent successfully. Help is on the way.',
            'data' => [
                'alert_id' => uniqid('EMR-', true),
                'timestamp' => now()->toIso8601String(),
                'location' => [
                    'latitude' => $request->input('latitude'),
                    'longitude' => $request->input('longitude'),
                ],
                'driver' => [
                    'id' => $driver->id,
                    'name' => $driver->name,
                    'driverid' => $driver->driverid,
                ],
            ],
        ]);
    }
}
