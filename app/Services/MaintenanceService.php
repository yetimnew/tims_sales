<?php

namespace App\Services;

use App\Models\Truck;
use App\Models\MaintenanceType;
use App\Models\VehicleMaintenanceRecord;
use App\Exceptions\MaintenanceException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MaintenanceService
{
    /**
     * Schedule maintenance for a truck.
     */
    public function scheduleMaintenance(int $truckId, int $maintenanceTypeId, array $data = []): VehicleMaintenanceRecord
    {
        return DB::transaction(function () use ($truckId, $maintenanceTypeId, $data) {
            $truck = Truck::findOrFail($truckId);
            $maintenanceType = MaintenanceType::findOrFail($maintenanceTypeId);

            if ($truck->status !== 'active') {
                throw new MaintenanceException('Cannot schedule maintenance for inactive truck');
            }

            if (!$maintenanceType->is_active) {
                throw new MaintenanceException('Maintenance type is not active');
            }

            $maintenance = VehicleMaintenanceRecord::create([
                'truck_id' => $truckId,
                'maintenance_type_id' => $maintenanceTypeId,
                'scheduled_date' => $data['scheduled_date'] ?? now()->addDays(7),
                'status' => 'scheduled',
                'user_id' => auth()->id(),
                ...$data
            ]);

            Log::info('Maintenance scheduled', [
                'maintenance_id' => $maintenance->id,
                'truck_id' => $truckId,
                'truck_plate' => $truck->plate,
                'maintenance_type' => $maintenanceType->name,
                'scheduled_date' => $maintenance->scheduled_date,
                'scheduled_by' => auth()->id(),
            ]);

            return $maintenance;
        });
    }

    /**
     * Complete maintenance.
     */
    public function completeMaintenance(int $maintenanceId, array $data = []): VehicleMaintenanceRecord
    {
        return DB::transaction(function () use ($maintenanceId, $data) {
            $maintenance = VehicleMaintenanceRecord::with(['truck', 'maintenanceType'])
                ->findOrFail($maintenanceId);

            if ($maintenance->status === 'completed') {
                throw new MaintenanceException('Maintenance is already completed');
            }

            $maintenance->update([
                'completed_date' => now(),
                'status' => 'completed',
                ...$data
            ]);

            Log::info('Maintenance completed', [
                'maintenance_id' => $maintenance->id,
                'truck_id' => $maintenance->truck_id,
                'truck_plate' => $maintenance->truck->plate,
                'maintenance_type' => $maintenance->maintenanceType->name,
                'cost' => $maintenance->cost,
                'completed_by' => auth()->id(),
            ]);

            return $maintenance;
        });
    }

    /**
     * Get overdue maintenance.
     */
    public function getOverdueMaintenance()
    {
        return VehicleMaintenanceRecord::with(['truck', 'maintenanceType'])
            ->where('status', 'scheduled')
            ->where('scheduled_date', '<', now())
            ->get();
    }

    /**
     * Get upcoming maintenance.
     */
    public function getUpcomingMaintenance(int $days = 7)
    {
        return VehicleMaintenanceRecord::with(['truck', 'maintenanceType'])
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_date', [now(), now()->addDays($days)])
            ->orderBy('scheduled_date')
            ->get();
    }

    /**
     * Calculate next maintenance date based on interval.
     */
    public function calculateNextMaintenanceDate(int $truckId, int $maintenanceTypeId): ?Carbon
    {
        $truck = Truck::findOrFail($truckId);
        $maintenanceType = MaintenanceType::findOrFail($maintenanceTypeId);

        // Get last maintenance of this type
        $lastMaintenance = VehicleMaintenanceRecord::where('truck_id', $truckId)
            ->where('maintenance_type_id', $maintenanceTypeId)
            ->where('status', 'completed')
            ->orderBy('completed_date', 'desc')
            ->first();

        if (!$lastMaintenance) {
            // If no previous maintenance, schedule based on service start date
            return $truck->serviceStartDate ?
                Carbon::parse($truck->serviceStartDate)->addMonths($maintenanceType->interval_months ?? 6) :
                now()->addMonths($maintenanceType->interval_months ?? 6);
        }

        // Calculate next date based on interval
        if ($maintenanceType->interval_months) {
            return Carbon::parse($lastMaintenance->completed_date)->addMonths($maintenanceType->interval_months);
        }

        if ($maintenanceType->interval_km && $lastMaintenance->odometer_reading) {
            // This would require current odometer reading
            return null;
        }

        return null;
    }

    /**
     * Get maintenance history for a truck.
     */
    public function getMaintenanceHistory(int $truckId)
    {
        return VehicleMaintenanceRecord::with(['maintenanceType'])
            ->where('truck_id', $truckId)
            ->orderBy('scheduled_date', 'desc')
            ->get();
    }

    /**
     * Get maintenance statistics.
     */
    public function getMaintenanceStatistics()
    {
        return [
            'total_scheduled' => VehicleMaintenanceRecord::where('status', 'scheduled')->count(),
            'total_completed' => VehicleMaintenanceRecord::where('status', 'completed')->count(),
            'total_overdue' => VehicleMaintenanceRecord::where('status', 'scheduled')
                ->where('scheduled_date', '<', now())->count(),
            'total_cost' => VehicleMaintenanceRecord::where('status', 'completed')
                ->sum('cost'),
            'average_cost' => VehicleMaintenanceRecord::where('status', 'completed')
                ->avg('cost'),
        ];
    }
}



