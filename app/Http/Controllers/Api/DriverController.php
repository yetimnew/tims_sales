<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverTruck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    /**
     * Get user profile (now using User model for authentication)
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Get assigned truck information for the authenticated user.
     * Returns truck assignment data if user is a driver with an active assignment.
     * 
     * Possible scenarios:
     * 1. User is not a driver → status: 'no_driver'
     * 2. User is a driver but no truck assigned → status: 'no_assignment'
     * 3. User has assignment but it was removed/detached → status: 'assignment_removed'
     * 4. User has active truck assignment → status: 'assigned'
     */
    public function truck(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check if user is a driver
        $driver = $user->driver;
        
        if (!$driver) {
            return response()->json([
                'success' => true,
                'status' => 'no_driver',
                'data' => null,
                'message' => 'You are not registered as a driver. Please contact administrator.',
            ]);
        }
        
        // Load active truck assignment with truck and vehicle type details
        $activeAssignment = $driver->activeTruckAssignment()
            ->with(['truck.vehicleType'])
            ->first();
        
        if (!$activeAssignment) {
            // Check if there's any assignment history (to show last assignment if removed)
            $lastAssignment = $driver->driverTrucks()
                ->with(['truck.vehicleType'])
                ->orderByDesc('date_recived')
                ->first();
            
            if ($lastAssignment) {
                // Assignment exists but was removed/detached
                return response()->json([
                    'success' => true,
                    'status' => 'assignment_removed',
                    'data' => [
                        'driver' => [
                            'id' => $driver->id,
                            'driverid' => $driver->driverid,
                            'name' => $driver->name,
                            'name_translations' => $driver->name_translations,
                            'localized_name' => $driver->localized_name,
                        ],
                        'last_assignment' => [
                            'id' => $lastAssignment->id,
                            'truck' => [
                                'id' => $lastAssignment->truck->id,
                                'plate' => $lastAssignment->truck->plate,
                                'vehicle_type' => $lastAssignment->truck->vehicleType ? [
                                    'id' => $lastAssignment->truck->vehicleType->id,
                                    'name' => $lastAssignment->truck->vehicleType->name,
                                ] : null,
                            ],
                            'date_recived' => $lastAssignment->date_recived?->toDateString(),
                            'date_detach' => $lastAssignment->date_detach?->toDateString(),
                            'reason' => $lastAssignment->reason,
                            'is_attached' => (bool) $lastAssignment->is_attached,
                            'status' => $lastAssignment->status,
                        ],
                    ],
                    'message' => $lastAssignment->date_detach 
                        ? "Your truck assignment was removed on " . $lastAssignment->date_detach->format('M d, Y')
                        : 'Your truck assignment is not active.',
                ]);
            }
            
            // No assignment ever existed
            return response()->json([
                'success' => true,
                'status' => 'no_assignment',
                'data' => [
                    'driver' => [
                        'id' => $driver->id,
                        'driverid' => $driver->driverid,
                        'name' => $driver->name,
                        'name_translations' => $driver->name_translations,
                        'localized_name' => $driver->localized_name,
                    ],
                ],
                'message' => 'You don\'t have an active truck assignment yet.',
            ]);
        }
        
        // Active assignment exists
        $truck = $activeAssignment->truck;
        
        return response()->json([
            'success' => true,
            'status' => 'assigned',
            'data' => [
                'assignment' => [
                    'id' => $activeAssignment->id,
                    'date_recived' => $activeAssignment->date_recived?->toDateString(),
                    'date_detach' => $activeAssignment->date_detach?->toDateString(),
                    'is_attached' => (bool) $activeAssignment->is_attached,
                    'status' => $activeAssignment->status,
                ],
                'truck' => [
                    'id' => $truck->id,
                    'plate' => $truck->plate,
                    'vehicle_type' => $truck->vehicleType ? [
                        'id' => $truck->vehicleType->id,
                        'name' => $truck->vehicleType->name,
                    ] : null,
                    'chasis_number' => $truck->chasisNumber,
                    'engine_number' => $truck->engineNumber,
                    'production_date' => $truck->productionDate?->toDateString(),
                    'service_start_date' => $truck->serviceStartDate?->toDateString(),
                    'status' => $truck->status,
                ],
                'driver' => [
                    'id' => $driver->id,
                    'driverid' => $driver->driverid,
                    'name' => $driver->name,
                    'name_translations' => $driver->name_translations,
                    'localized_name' => $driver->localized_name,
                ],
            ],
            'message' => 'Active truck assignment found.',
        ]);
    }
}
