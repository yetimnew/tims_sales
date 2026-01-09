<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverPerformanceRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverPerformanceController extends Controller
{
    /**
     * Get driver performance metrics
     */
    public function index(Request $request): JsonResponse
    {
        $driver = $request->user();

        // Get latest performance record
        $latestRecord = DriverPerformanceRecord::where('driver_id', $driver->id)
            ->orderByDesc('record_date')
            ->orderByDesc('created_at')
            ->first();

        // Calculate summary from all records
        $summary = DriverPerformanceRecord::where('driver_id', $driver->id)
            ->selectRaw('
                COUNT(*) as total_records,
                SUM(total_trips) as total_trips,
                SUM(total_distance_km) as total_distance_km,
                AVG(fuel_efficiency) as avg_fuel_efficiency,
                AVG(customer_rating) as avg_customer_rating,
                SUM(safety_violations) as total_safety_violations,
                SUM(accidents) as total_accidents
            ')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_trips' => (int) ($summary->total_trips ?? 0),
                    'total_distance_km' => (float) ($summary->total_distance_km ?? 0),
                    'avg_fuel_efficiency' => $summary->avg_fuel_efficiency ? (float) $summary->avg_fuel_efficiency : null,
                    'avg_customer_rating' => $summary->avg_customer_rating ? (float) $summary->avg_customer_rating : null,
                    'total_safety_violations' => (int) ($summary->total_safety_violations ?? 0),
                    'total_accidents' => (int) ($summary->total_accidents ?? 0),
                ],
                'latest_record' => $latestRecord ? [
                    'id' => $latestRecord->id,
                    'record_date' => $latestRecord->record_date->toDateString(),
                    'total_trips' => $latestRecord->total_trips,
                    'total_distance_km' => (float) $latestRecord->total_distance_km,
                    'fuel_efficiency' => $latestRecord->fuel_efficiency ? (float) $latestRecord->fuel_efficiency : null,
                    'customer_rating' => $latestRecord->customer_rating ? (float) $latestRecord->customer_rating : null,
                    'safety_violations' => $latestRecord->safety_violations,
                    'accidents' => $latestRecord->accidents,
                    'performance_score' => $latestRecord->performance_score,
                    'performance_grade' => $latestRecord->performance_grade,
                ] : null,
            ],
        ]);
    }
}
