<?php

namespace App\Services;

use App\Models\DriverTruck;
use App\Models\Driver;
use App\Models\Truck;
use App\Exceptions\TruckAssignmentException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class TruckAssignmentService
{
    /**
     * Assign a driver to a truck.
     */
    public function assignDriverToTruck(int $driverId, int $truckId, array $data = []): DriverTruck
    {
        return DB::transaction(function () use ($driverId, $truckId, $data) {
            // Check if driver exists and is active
            $driver = Driver::where('id', $driverId)
                ->where('status', 'active')
                ->first();

            if (!$driver) {
                throw new TruckAssignmentException('Driver not found or inactive');
            }

            // Check if truck exists and is active
            $truck = Truck::where('id', $truckId)
                ->where('status', 'active')
                ->first();

            if (!$truck) {
                throw new TruckAssignmentException('Truck not found or inactive');
            }

            // Check if driver is already assigned to another truck
            $activeAssignment = DriverTruck::where('driver_id', $driverId)
                ->where('status', 'active')
                ->whereNull('unassigned_date')
                ->first();

            if ($activeAssignment) {
                throw new TruckAssignmentException('Driver is already assigned to another truck');
            }

            // Check if truck is already assigned to another driver
            $truckAssignment = DriverTruck::where('truck_id', $truckId)
                ->where('status', 'active')
                ->whereNull('unassigned_date')
                ->first();

            if ($truckAssignment) {
                throw new TruckAssignmentException('Truck is already assigned to another driver');
            }

            // Create the assignment
            $assignment = DriverTruck::create([
                'driver_id' => $driverId,
                'truck_id' => $truckId,
                'assigned_date' => now(),
                'status' => 'active',
                ...$data
            ]);

            // Log the assignment
            Log::info('Driver assigned to truck', [
                'assignment_id' => $assignment->id,
                'driver_id' => $driverId,
                'driver_name' => $driver->name,
                'truck_id' => $truckId,
                'truck_plate' => $truck->plate,
                'assigned_by' => auth()->id(),
                'assigned_at' => now(),
            ]);

            return $assignment;
        });
    }

    /**
     * Unassign a driver from a truck.
     */
    public function unassignDriverFromTruck(int $assignmentId): DriverTruck
    {
        return DB::transaction(function () use ($assignmentId) {
            $assignment = DriverTruck::with(['driver', 'truck'])
                ->findOrFail($assignmentId);

            if ($assignment->status !== 'active') {
                throw new TruckAssignmentException('Assignment is not active');
            }

            $assignment->update([
                'unassigned_date' => now(),
                'status' => 'inactive'
            ]);

            // Log the unassignment
            Log::info('Driver unassigned from truck', [
                'assignment_id' => $assignment->id,
                'driver_id' => $assignment->driver_id,
                'driver_name' => $assignment->driver->name,
                'truck_id' => $assignment->truck_id,
                'truck_plate' => $assignment->truck->plate,
                'unassigned_by' => auth()->id(),
                'unassigned_at' => now(),
            ]);

            return $assignment;
        });
    }

    /**
     * Get available drivers (not assigned to any truck).
     */
    public function getAvailableDrivers()
    {
        return Driver::query()
            ->select('drivers.*')
            ->where('drivers.status', 'active')
            ->whereDoesntHave('trucks', function ($query) {
                $query->where('driver_truck.status', 'active')
                    ->whereNull('driver_truck.unassigned_date');
            })
            ->addSelect([
                'last_detached_at' => DriverTruck::select('unassigned_date')
                    ->whereColumn('driver_truck.driver_id', 'drivers.id')
                    ->whereNotNull('driver_truck.unassigned_date')
                    ->orderByDesc('driver_truck.unassigned_date')
                    ->limit(1),
            ])
            ->get();
    }

    /**
     * Get available trucks (not assigned to any driver).
     */
    public function getAvailableTrucks()
    {
        return Truck::query()
            ->select('trucks.*')
            ->where('trucks.status', 'active')
            ->whereDoesntHave('drivers', function ($query) {
                $query->where('driver_truck.status', 'active')
                    ->whereNull('driver_truck.unassigned_date');
            })
            ->addSelect([
                'last_detached_at' => DriverTruck::select('unassigned_date')
                    ->whereColumn('driver_truck.truck_id', 'trucks.id')
                    ->whereNotNull('driver_truck.unassigned_date')
                    ->orderByDesc('driver_truck.unassigned_date')
                    ->limit(1),
            ])
            ->get();
    }

    /**
     * Get current assignments.
     */
    public function getCurrentAssignments()
    {
        return DriverTruck::with(['driver', 'truck'])
            ->where('status', 'active')
            ->whereNull('unassigned_date')
            ->get();
    }
}



