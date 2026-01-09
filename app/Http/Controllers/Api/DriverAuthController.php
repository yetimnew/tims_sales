<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class DriverAuthController extends Controller
{
    /**
     * Driver login
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'driverid' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $driver = Driver::where('driverid', $request->driverid)
            ->where('status', 'active')
            ->first();

        if (!$driver || !Hash::check($request->password, $driver->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid driver ID or password',
            ], 401);
        }

        // Revoke existing tokens
        $driver->tokens()->delete();

        // Create new token
        $token = $driver->createToken('driver-mobile-app')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'driver' => [
                    'id' => $driver->id,
                    'driverid' => $driver->driverid,
                    'name' => $driver->name,
                    'mobile' => $driver->mobile,
                    'status' => $driver->status,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Driver logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }
}
