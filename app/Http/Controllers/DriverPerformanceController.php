<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\Truck;
use App\Models\DriverPerformanceRecord;
use App\Models\DriverSafetyRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class DriverPerformanceController extends Controller
{
    /**
     * Display a listing of driver performance records.
     */
    public function index(): Response
    {
        $performanceRecords = DriverPerformanceRecord::with(['driver', 'truck'])
            ->orderBy('record_date', 'desc')
            ->paginate(15);

        // Cache statistics for 5 minutes - they change frequently but don't need real-time accuracy
        $statistics = Cache::remember('driver_performance.statistics', 300, fn () => $this->getPerformanceStatistics());

        return Inertia::render('DriverPerformance/Index', [
            'performanceRecords' => $performanceRecords,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Show the form for creating a new performance record.
     */
    public function create(): Response
    {
        // Cache active drivers (1 hour) - changes when drivers are added/removed
        $drivers = Cache::remember('driver_performance.create_drivers', 3600, function () {
            return Driver::where('status', 'active')->get();
        });

        // Cache active trucks (1 hour) - changes when trucks are added/removed
        $trucks = Cache::remember('driver_performance.create_trucks', 3600, function () {
            return Truck::where('status', 'active')->get();
        });

        return Inertia::render('DriverPerformance/Create', [
            'drivers' => $drivers,
            'trucks' => $trucks,
        ]);
    }

    /**
     * Store a newly created performance record.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'driver_id' => 'required|exists:drivers,id',
                'truck_id' => 'required|exists:trucks,id',
                'record_date' => 'required|date|before_or_equal:today',
                'total_trips' => 'required|integer|min:0',
                'total_distance_km' => 'required|numeric|min:0',
                'total_cargo_tonnage' => 'required|numeric|min:0',
                'fuel_efficiency' => 'nullable|numeric|min:0|max:20',
                'safety_violations' => 'required|integer|min:0',
                'accidents' => 'required|integer|min:0',
                'customer_rating' => 'nullable|numeric|min:1|max:5',
                'performance_notes' => 'nullable|string|max:1000',
                'period_type' => 'required|string|in:daily,weekly,monthly',
            ]);

            $performanceRecord = DriverPerformanceRecord::create($validated);

            Log::info('Driver performance record created', [
                'performance_record_id' => $performanceRecord->id,
                'driver_id' => $performanceRecord->driver_id,
                'truck_id' => $performanceRecord->truck_id,
                'record_date' => $performanceRecord->record_date,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('driver-performance.index')
                ->with('success', 'Performance record created successfully.');

        } catch (Exception $e) {
            Log::error('Driver performance record creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create performance record. Please try again.']);
        }
    }

    /**
     * Display the specified performance record.
     */
    public function show(DriverPerformanceRecord $driverPerformance): Response
    {
        $driverPerformance->load(['driver', 'truck']);

        return Inertia::render('DriverPerformance/Show', [
            'driverPerformance' => $driverPerformance,
        ]);
    }

    /**
     * Show the form for editing the specified performance record.
     */
    public function edit(DriverPerformanceRecord $driverPerformance): Response
    {
        // Cache active drivers (1 hour) - changes when drivers are added/removed
        $drivers = Cache::remember('driver_performance.create_drivers', 3600, function () {
            return Driver::where('status', 'active')->get();
        });

        // Cache active trucks (1 hour) - changes when trucks are added/removed
        $trucks = Cache::remember('driver_performance.create_trucks', 3600, function () {
            return Truck::where('status', 'active')->get();
        });

        return Inertia::render('DriverPerformance/Edit', [
            'driverPerformance' => $driverPerformance,
            'drivers' => $drivers,
            'trucks' => $trucks,
        ]);
    }

    /**
     * Update the specified performance record.
     */
    public function update(Request $request, DriverPerformanceRecord $driverPerformance)
    {
        try {
            $validated = $request->validate([
                'driver_id' => 'required|exists:drivers,id',
                'truck_id' => 'required|exists:trucks,id',
                'record_date' => 'required|date|before_or_equal:today',
                'total_trips' => 'required|integer|min:0',
                'total_distance_km' => 'required|numeric|min:0',
                'total_cargo_tonnage' => 'required|numeric|min:0',
                'fuel_efficiency' => 'nullable|numeric|min:0|max:20',
                'safety_violations' => 'required|integer|min:0',
                'accidents' => 'required|integer|min:0',
                'customer_rating' => 'nullable|numeric|min:1|max:5',
                'performance_notes' => 'nullable|string|max:1000',
                'period_type' => 'required|string|in:daily,weekly,monthly',
            ]);

            $driverPerformance->update($validated);

            Log::info('Driver performance record updated', [
                'performance_record_id' => $driverPerformance->id,
                'driver_id' => $driverPerformance->driver_id,
                'truck_id' => $driverPerformance->truck_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('driver-performance.index')
                ->with('success', 'Performance record updated successfully.');

        } catch (Exception $e) {
            Log::error('Driver performance record update failed', [
                'performance_record_id' => $driverPerformance->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update performance record. Please try again.']);
        }
    }

    /**
     * Remove the specified performance record.
     */
    public function destroy(DriverPerformanceRecord $driverPerformance)
    {
        try {
            $performanceData = $driverPerformance->toArray();
            $driverPerformance->delete();

            Log::info('Driver performance record deleted', [
                'performance_record_id' => $driverPerformance->id,
                'driver_id' => $performanceData['driver_id'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('driver-performance.index')
                ->with('success', 'Performance record deleted successfully.');

        } catch (Exception $e) {
            Log::error('Driver performance record deletion failed', [
                'performance_record_id' => $driverPerformance->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete performance record. Please try again.']);
        }
    }

    /**
     * Get driver performance analytics.
     */
    public function analytics(Request $request)
    {
        try {
            $driverId = $request->get('driver_id');
            $periodType = $request->get('period_type', 'monthly');
            $startDate = $request->get('start_date', now()->subMonths(6));
            $endDate = $request->get('end_date', now());

            $query = DriverPerformanceRecord::with(['driver', 'truck'])
                ->where('period_type', $periodType)
                ->whereBetween('record_date', [$startDate, $endDate]);

            if ($driverId) {
                $query->where('driver_id', $driverId);
            }

            $analytics = $query->orderBy('record_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $analytics,
                'count' => $analytics->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get driver performance analytics', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve driver performance analytics'
            ], 500);
        }
    }

    /**
     * Get top performing drivers.
     */
    public function topPerformers(Request $request)
    {
        try {
            $limit = $request->get('limit', 10);
            $periodType = $request->get('period_type', 'monthly');

            $topPerformers = DriverPerformanceRecord::with(['driver'])
                ->where('period_type', $periodType)
                ->where('record_date', '>=', now()->subMonths(3))
                ->select('driver_id', DB::raw('AVG(fuel_efficiency) as avg_fuel_efficiency'),
                        DB::raw('SUM(total_trips) as total_trips'),
                        DB::raw('SUM(total_distance_km) as total_distance'),
                        DB::raw('AVG(customer_rating) as avg_customer_rating'),
                        DB::raw('SUM(safety_violations) as total_violations'),
                        DB::raw('SUM(accidents) as total_accidents'))
                ->groupBy('driver_id')
                ->orderBy('avg_fuel_efficiency', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $topPerformers,
                'count' => $topPerformers->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get top performing drivers', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve top performing drivers'
            ], 500);
        }
    }

    /**
     * Get performance statistics.
     */
    private function getPerformanceStatistics()
    {
        return [
            'total_records' => DriverPerformanceRecord::count(),
            'total_trips' => DriverPerformanceRecord::sum('total_trips'),
            'total_distance' => DriverPerformanceRecord::sum('total_distance_km'),
            'total_cargo' => DriverPerformanceRecord::sum('total_cargo_tonnage'),
            'average_fuel_efficiency' => DriverPerformanceRecord::avg('fuel_efficiency'),
            'average_customer_rating' => DriverPerformanceRecord::avg('customer_rating'),
            'total_violations' => DriverPerformanceRecord::sum('safety_violations'),
            'total_accidents' => DriverPerformanceRecord::sum('accidents'),
        ];
    }
}



