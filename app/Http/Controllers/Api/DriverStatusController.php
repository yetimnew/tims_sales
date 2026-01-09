<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverStatusHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DriverStatusController extends Controller
{
    /**
     * Update driver status
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

        $driver = $request->user();

        $statusHistory = DriverStatusHistory::create([
            'driver_id' => $driver->id,
            'status_type' => $request->status_type,
            'status_value' => $request->status_value,
            'notes' => $request->notes,
        ]);

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
     * Get driver status history
     */
    public function history(Request $request): JsonResponse
    {
        $driver = $request->user();

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
