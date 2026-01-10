<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\VehicleMaintenanceRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverMaintenanceController extends Controller
{
    /**
     * Get the driver associated with the authenticated user
     * Uses the User->Driver relationship (user_id in drivers table)
     * Returns null if user is not a driver
     */
    private function getDriverForUser($user): ?Driver
    {
        // Use the User->Driver relationship via user_id
        return $user->driver;
    }

    /**
     * Get maintenance schedules for assigned truck
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found. Please contact administrator to link your account to a driver record.',
                'data' => [
                    'upcoming' => [],
                    'overdue' => [],
                    'recent' => [],
                ],
            ], 404);
        }

        // Get active truck assignment
        $activeAssignment = DriverTruck::where('driver_id', $driver->id)
            ->where('status', 'active')
            ->whereNull('date_detach')
            ->where('is_attached', true)
            ->latest('date_recived')
            ->first();

        if (!$activeAssignment || !$activeAssignment->truck_id) {
            return response()->json([
                'success' => true,
                'data' => [
                    'upcoming' => [],
                    'overdue' => [],
                    'recent' => [],
                ],
            ]);
        }

        $truckId = $activeAssignment->truck_id;

        // Get upcoming maintenance (next 30 days)
        $upcoming = VehicleMaintenanceRecord::where('truck_id', $truckId)
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_date', [now(), now()->addDays(30)])
            ->with(['maintenanceType'])
            ->orderBy('scheduled_date')
            ->get()
            ->map(function ($maintenance) {
                return $this->formatMaintenance($maintenance);
            });

        // Get overdue maintenance
        $overdue = VehicleMaintenanceRecord::where('truck_id', $truckId)
            ->where('status', 'scheduled')
            ->where('scheduled_date', '<', now())
            ->with(['maintenanceType'])
            ->orderBy('scheduled_date')
            ->get()
            ->map(function ($maintenance) {
                return $this->formatMaintenance($maintenance);
            });

        // Get recent completed maintenance (last 10)
        $recent = VehicleMaintenanceRecord::where('truck_id', $truckId)
            ->where('status', 'completed')
            ->with(['maintenanceType'])
            ->orderByDesc('completed_date')
            ->limit(10)
            ->get()
            ->map(function ($maintenance) {
                return $this->formatMaintenance($maintenance);
            });

        return response()->json([
            'success' => true,
            'data' => [
                'upcoming' => $upcoming,
                'overdue' => $overdue,
                'recent' => $recent,
            ],
        ]);
    }

    /**
     * Get maintenance details
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found.',
            ], 404);
        }

        // Verify maintenance belongs to driver's assigned truck
        $activeAssignment = DriverTruck::where('driver_id', $driver->id)
            ->where('status', 'active')
            ->whereNull('date_detach')
            ->where('is_attached', true)
            ->latest('date_recived')
            ->first();

        if (!$activeAssignment || !$activeAssignment->truck_id) {
            return response()->json([
                'success' => false,
                'message' => 'No active truck assignment',
            ], 404);
        }

        $maintenance = VehicleMaintenanceRecord::where('id', $id)
            ->where('truck_id', $activeAssignment->truck_id)
            ->with(['maintenanceType', 'truck'])
            ->first();

        if (!$maintenance) {
            return response()->json([
                'success' => false,
                'message' => 'Maintenance record not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatMaintenance($maintenance, true),
        ]);
    }

    /**
     * Format maintenance data
     */
    private function formatMaintenance(VehicleMaintenanceRecord $maintenance, bool $detailed = false): array
    {
        $data = [
            'id' => $maintenance->id,
            'status' => $maintenance->status,
            'scheduled_date' => $maintenance->scheduled_date?->toDateString(),
            'completed_date' => $maintenance->completed_date?->toDateString(),
            'maintenance_type' => $maintenance->maintenanceType ? [
                'id' => $maintenance->maintenanceType->id,
                'name' => $maintenance->maintenanceType->name,
            ] : null,
        ];

        if ($detailed) {
            $data = array_merge($data, [
                'odometer_reading' => $maintenance->odometer_reading,
                'cost' => $maintenance->cost ? (float) $maintenance->cost : null,
                'description' => $maintenance->description,
                'work_performed' => $maintenance->work_performed,
                'parts_replaced' => $maintenance->parts_replaced,
                'service_provider' => $maintenance->service_provider,
                'is_overdue' => $maintenance->is_overdue,
                'days_until_scheduled' => $maintenance->days_until_scheduled,
            ]);
        } else {
            $data['is_overdue'] = $maintenance->is_overdue;
            $data['days_until_scheduled'] = $maintenance->days_until_scheduled;
        }

        return $data;
    }
}
