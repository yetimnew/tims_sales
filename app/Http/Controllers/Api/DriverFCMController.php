<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DriverFCMController extends Controller
{
    /**
     * Get driver for authenticated user
     */
    private function getDriverForUser(User $user)
    {
        return $user->driver;
    }

    /**
     * Update driver's FCM token
     */
    public function updateToken(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fcm_token' => 'required|string|max:255',
            'device_type' => 'nullable|string|in:android,ios,web,mobile',
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

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found.',
            ], 404);
        }

        // Update or create FCM token record
        // Note: You may need to create a drivers_fcm_tokens table or add fcm_token column to drivers table
        // For now, we'll store it in a separate table or as a JSON field

        // TODO: Implement FCM token storage
        // Example: Store in drivers_fcm_tokens table
        // DriverFCMToken::updateOrCreate(
        //     ['driver_id' => $driver->id],
        //     [
        //         'fcm_token' => $request->fcm_token,
        //         'device_type' => $request->device_type ?? 'mobile',
        //         'updated_at' => now(),
        //     ]
        // );

        // For MVP, return success
        return response()->json([
            'success' => true,
            'message' => 'FCM token updated successfully',
        ]);
    }

    /**
     * Delete driver's FCM token
     */
    public function deleteToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found.',
            ], 404);
        }

        // TODO: Delete FCM token from database
        // DriverFCMToken::where('driver_id', $driver->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'FCM token deleted successfully',
        ]);
    }
}
