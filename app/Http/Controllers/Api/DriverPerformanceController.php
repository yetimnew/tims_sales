<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\DriverPerformanceRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverPerformanceController extends Controller
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
     * Get driver performance metrics
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found. Please contact administrator to link your account to a driver record.',
                'data' => null,
            ], 404);
        }

        // Get latest performance record with truck relationship
        $latestRecord = DriverPerformanceRecord::where('driver_id', $driver->id)
            ->with('truck:id,plate')
            ->orderByDesc('record_date')
            ->orderByDesc('created_at')
            ->first();

        // Calculate summary from all records
        $summary = DriverPerformanceRecord::where('driver_id', $driver->id)
            ->selectRaw('
                COUNT(*) as total_records,
                SUM(total_trips) as total_trips,
                SUM(total_distance_km) as total_distance_km,
                SUM(total_cargo_tonnage) as total_cargo_tonnage,
                AVG(fuel_efficiency) as avg_fuel_efficiency,
                AVG(customer_rating) as avg_customer_rating,
                SUM(safety_violations) as total_safety_violations,
                SUM(accidents) as total_accidents
            ')
            ->first();

        // Calculate performance score breakdown for latest record
        $scoreBreakdown = null;
        if ($latestRecord) {
            $scoreBreakdown = $this->calculateScoreBreakdown($latestRecord);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_records' => (int) ($summary->total_records ?? 0),
                    'total_trips' => (int) ($summary->total_trips ?? 0),
                    'total_distance_km' => (float) ($summary->total_distance_km ?? 0),
                    'total_cargo_tonnage' => (float) ($summary->total_cargo_tonnage ?? 0),
                    'avg_fuel_efficiency' => $summary->avg_fuel_efficiency ? (float) $summary->avg_fuel_efficiency : null,
                    'avg_customer_rating' => $summary->avg_customer_rating ? (float) $summary->avg_customer_rating : null,
                    'total_safety_violations' => (int) ($summary->total_safety_violations ?? 0),
                    'total_accidents' => (int) ($summary->total_accidents ?? 0),
                ],
                'latest_record' => $latestRecord ? [
                    'id' => $latestRecord->id,
                    'record_date' => $latestRecord->record_date->toDateString(),
                    'period_type' => $latestRecord->period_type,
                    'total_trips' => $latestRecord->total_trips,
                    'total_distance_km' => (float) $latestRecord->total_distance_km,
                    'total_cargo_tonnage' => (float) $latestRecord->total_cargo_tonnage,
                    'fuel_efficiency' => $latestRecord->fuel_efficiency ? (float) $latestRecord->fuel_efficiency : null,
                    'customer_rating' => $latestRecord->customer_rating ? (float) $latestRecord->customer_rating : null,
                    'safety_violations' => $latestRecord->safety_violations,
                    'accidents' => $latestRecord->accidents,
                    'performance_notes' => $latestRecord->performance_notes,
                    'performance_score' => $latestRecord->performance_score ?? 0,
                    'performance_grade' => $latestRecord->performance_grade ?? 'N/A',
                    'score_breakdown' => $scoreBreakdown,
                    'truck' => $latestRecord->truck ? [
                        'id' => $latestRecord->truck->id,
                        'plate' => $latestRecord->truck->plate,
                    ] : null,
                ] : null,
            ],
        ]);
    }

    /**
     * Get performance history with optional filters
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found.',
                'data' => [],
            ], 404);
        }

        $periodType = $request->query('period_type'); // 'daily', 'weekly', 'monthly'
        $limit = min((int) $request->query('limit', 10), 50);
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = DriverPerformanceRecord::where('driver_id', $driver->id)
            ->with('truck:id,plate')
            ->orderByDesc('record_date')
            ->orderByDesc('created_at');

        if ($periodType) {
            $query->where('period_type', $periodType);
        }

        if ($startDate) {
            $query->where('record_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('record_date', '<=', $endDate);
        }

        $records = $query->limit($limit)->get()->map(function ($record) {
            return [
                'id' => $record->id,
                'record_date' => $record->record_date->toDateString(),
                'period_type' => $record->period_type,
                'total_trips' => $record->total_trips,
                'total_distance_km' => (float) $record->total_distance_km,
                'total_cargo_tonnage' => (float) $record->total_cargo_tonnage,
                'fuel_efficiency' => $record->fuel_efficiency ? (float) $record->fuel_efficiency : null,
                'customer_rating' => $record->customer_rating ? (float) $record->customer_rating : null,
                'safety_violations' => $record->safety_violations,
                'accidents' => $record->accidents,
                'performance_score' => $record->performance_score ?? 0,
                'performance_grade' => $record->performance_grade ?? 'N/A',
                'truck' => $record->truck ? [
                    'id' => $record->truck->id,
                    'plate' => $record->truck->plate,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Calculate performance score breakdown
     */
    private function calculateScoreBreakdown($record): array
    {
        $breakdown = [
            'fuel_efficiency' => [
                'score' => 0,
                'max' => 30,
                'points' => 0,
            ],
            'safety' => [
                'score' => 0,
                'max' => 30,
                'points' => 0,
            ],
            'customer_rating' => [
                'score' => 0,
                'max' => 20,
                'points' => 0,
            ],
            'productivity' => [
                'score' => 0,
                'max' => 20,
                'points' => 0,
            ],
        ];

        // Fuel efficiency score (0-30 points)
        if ($record->fuel_efficiency > 0) {
            $breakdown['fuel_efficiency']['points'] = min(30, ($record->fuel_efficiency / 5.0) * 30);
            $breakdown['fuel_efficiency']['score'] = (int) round($breakdown['fuel_efficiency']['points']);
        }

        // Safety score (0-30 points)
        $safetyScore = 30 - ($record->safety_violations * 5) - ($record->accidents * 10);
        $breakdown['safety']['points'] = max(0, $safetyScore);
        $breakdown['safety']['score'] = (int) round($breakdown['safety']['points']);

        // Customer rating score (0-20 points)
        if ($record->customer_rating > 0) {
            $breakdown['customer_rating']['points'] = ($record->customer_rating / 5.0) * 20;
            $breakdown['customer_rating']['score'] = (int) round($breakdown['customer_rating']['points']);
        }

        // Productivity score (0-20 points)
        if ($record->total_trips > 0) {
            $breakdown['productivity']['points'] = min(20, ($record->total_trips / 10.0) * 20);
            $breakdown['productivity']['score'] = (int) round($breakdown['productivity']['points']);
        }

        return $breakdown;
    }
}
