<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DriverLocationController extends Controller
{
    /**
     * Store location update
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0',
            'speed' => 'nullable|numeric|min:0',
            'heading' => 'nullable|numeric|between:0,360',
            'timestamp' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $driver = $request->user();

        $location = DriverLocation::create([
            'driver_id' => $driver->id,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'accuracy' => $request->accuracy,
            'speed' => $request->speed,
            'heading' => $request->heading,
            'timestamp' => $request->timestamp ? now()->parse($request->timestamp) : now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Location updated successfully',
            'data' => [
                'id' => $location->id,
                'latitude' => (float) $location->latitude,
                'longitude' => (float) $location->longitude,
                'accuracy' => $location->accuracy ? (float) $location->accuracy : null,
                'speed' => $location->speed ? (float) $location->speed : null,
                'heading' => $location->heading ? (float) $location->heading : null,
                'timestamp' => $location->timestamp->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Get location history
     */
    public function history(Request $request): JsonResponse
    {
        $driver = $request->user();

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $limit = min((int) $request->query('limit', 100), 500);

        $query = DriverLocation::where('driver_id', $driver->id)
            ->orderByDesc('timestamp')
            ->limit($limit);

        if ($startDate) {
            $query->where('timestamp', '>=', now()->parse($startDate));
        }

        if ($endDate) {
            $query->where('timestamp', '<=', now()->parse($endDate));
        }

        $locations = $query->get()->map(function ($location) {
            return [
                'id' => $location->id,
                'latitude' => (float) $location->latitude,
                'longitude' => (float) $location->longitude,
                'accuracy' => $location->accuracy ? (float) $location->accuracy : null,
                'speed' => $location->speed ? (float) $location->speed : null,
                'heading' => $location->heading ? (float) $location->heading : null,
                'timestamp' => $location->timestamp->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $locations,
        ]);
    }
}
