<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverTruck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    /**
     * Get driver profile
     */
    public function profile(Request $request): JsonResponse
    {
        $driver = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $driver->id,
                'driverid' => $driver->driverid,
                'name' => $driver->name,
                'sex' => $driver->sex,
                'birthdate' => $driver->birthdate?->toDateString(),
                'zone' => $driver->zone,
                'woreda' => $driver->woreda,
                'kebele' => $driver->kebele,
                'housenumber' => $driver->housenumber,
                'mobile' => $driver->mobile,
                'hireddate' => $driver->hireddate?->toDateString(),
                'status' => $driver->status,
            ],
        ]);
    }

    /**
     * Get assigned truck information
     */
    public function truck(Request $request): JsonResponse
    {
        $driver = $request->user();

        $activeAssignment = DriverTruck::where('driver_id', $driver->id)
            ->where('status', 'active')
            ->whereNull('unassigned_date')
            ->with(['truck.vehicleType'])
            ->first();

        if (!$activeAssignment || !$activeAssignment->truck) {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'No truck assigned',
            ]);
        }

        $truck = $activeAssignment->truck;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $truck->id,
                'plate' => $truck->plate,
                'chasisNumber' => $truck->chasisNumber,
                'engineNumber' => $truck->engineNumber,
                'tyreSyze' => $truck->tyreSyze,
                'serviceIntervalKM' => $truck->serviceIntervalKM,
                'purchasePrice' => $truck->purchasePrice,
                'productionDate' => $truck->productionDate?->toDateString(),
                'serviceStartDate' => $truck->serviceStartDate?->toDateString(),
                'status' => $truck->status,
                'vehicleType' => $truck->vehicleType ? [
                    'id' => $truck->vehicleType->id,
                    'name' => $truck->vehicleType->name,
                ] : null,
                'assignment' => [
                    'id' => $activeAssignment->id,
                    'assigned_date' => $activeAssignment->assigned_date?->toDateString(),
                    'date_recived' => $activeAssignment->date_recived?->toDateString(),
                ],
            ],
        ]);
    }
}
