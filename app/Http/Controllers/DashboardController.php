<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\Driver;
use App\Models\Operation;
use App\Models\Performance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(): Response
    {
        // Get basic counts
        $totalTrucks = Truck::count();
        $activeTrucks = Truck::where('status', 'active')->count();
        $totalDrivers = Driver::count();
        $activeDrivers = Driver::where('status', 'active')->count();
        $totalOperations = Operation::count();
        $openOperations = Operation::where('closed', false)->count();

        // Get performance statistics
        $totalPerformances = Performance::count();
        $returnedPerformances = Performance::where('is_returned', true)->count();
        $notReturnedPerformances = Performance::where('is_returned', false)->count();

        // Calculate total tonnage
        $totalTonnage = Performance::sum('CargoVolumMT') ?? 0;

        // Get daily performance data for the last 30 days
        $dailyPerformance = Performance::selectRaw('DATE(DateDispach) as date, SUM(CargoVolumMT) as tonnage')
            ->where('DateDispach', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Get operations report
        $operationsReport = Operation::with('customer')
            ->selectRaw('customer_id, COUNT(*) as count, SUM(volume) as total_volume')
            ->groupBy('customer_id')
            ->with('customer')
            ->limit(10)
            ->get();

        // Get status breakdown
        $statusBreakdown = Performance::selectRaw('satus, COUNT(*) as count')
            ->groupBy('satus')
            ->get();

        // Get recent performances with debug logging
        $recentPerformances = Performance::with([
            'operation.customer',
            'driverTruck.driver',
            'driverTruck.truck',
            'origin',
            'destination'
        ])
        ->latest('DateDispach')
        ->limit(10)
        ->get();

        // Debug: Log the raw data
        \Log::info('Dashboard - Recent Performances Count:', ['count' => $recentPerformances->count()]);
        \Log::info('Dashboard - First Performance:', $recentPerformances->first()?->toArray() ?? []);
        \Log::info('Dashboard - Driver Truck IDs:', $recentPerformances->pluck('driver_truck_id')->toArray());

        // Transform performances to ensure nested relationships are serialized properly for Inertia
        $formattedPerformances = $recentPerformances->map(function ($performance) {
            return [
                'id' => $performance->id,
                'trip' => $performance->trip,
                'DateDispach' => $performance->DateDispach,
                'CargoVolumMT' => $performance->CargoVolumMT,
                'satus' => $performance->satus,
                'driverTruck' => $performance->driverTruck ? [
                    'id' => $performance->driverTruck->id,
                    'driver' => $performance->driverTruck->driver ? [
                        'id' => $performance->driverTruck->driver->id,
                        'name' => $performance->driverTruck->driver->name,
                    ] : null,
                    'truck' => $performance->driverTruck->truck ? [
                        'id' => $performance->driverTruck->truck->id,
                        'plate' => $performance->driverTruck->truck->plate,
                    ] : null,
                ] : null,
                'origin' => $performance->origin ? [
                    'id' => $performance->origin->id,
                    'name' => $performance->origin->name,
                ] : null,
                'destination' => $performance->destination ? [
                    'id' => $performance->destination->id,
                    'name' => $performance->destination->name,
                ] : null,
            ];
        })->toArray();

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalTrucks' => $totalTrucks,
                'activeTrucks' => $activeTrucks,
                'totalDrivers' => $totalDrivers,
                'activeDrivers' => $activeDrivers,
                'totalOperations' => $totalOperations,
                'openOperations' => $openOperations,
                'totalPerformances' => $totalPerformances,
                'returnedPerformances' => $returnedPerformances,
                'notReturnedPerformances' => $notReturnedPerformances,
                'totalTonnage' => $totalTonnage,
            ],
            'dailyPerformance' => $dailyPerformance,
            'operationsReport' => $operationsReport,
            'statusBreakdown' => $statusBreakdown,
            'recentPerformances' => $formattedPerformances,
        ]);
    }
}
