<?php

namespace App\Http\Controllers;

use App\Models\Operation;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\RoutePlan;
use App\Models\Place;
use App\Models\Distance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class RoutePlanController extends Controller
{
    /**
     * Display a listing of route plans.
     */
    public function index(): Response
    {
        $routePlans = RoutePlan::with(['operation', 'truck', 'driver', 'user'])
            ->orderBy('planned_date', 'desc')
            ->paginate(15);

        // Cache statistics for 5 minutes - they change frequently but don't need real-time accuracy
        $statistics = Cache::remember('route_plans.statistics', 300, fn () => $this->getRoutePlanStatistics());

        return Inertia::render('RoutePlans/Index', [
            'routePlans' => $routePlans,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Show the form for creating a new route plan.
     */
    public function create(): Response
    {
        // Cache active operations (1 hour) - changes when operations are added/removed
        $operations = Cache::remember('route_plans.create_operations', 3600, function () {
            return Operation::where('status', 'active')->get();
        });

        // Cache active trucks (1 hour) - changes when trucks are added/removed
        $trucks = Cache::remember('route_plans.create_trucks', 3600, function () {
            return Truck::where('status', 'active')->get();
        });

        // Cache active drivers (1 hour) - changes when drivers are added/removed
        $drivers = Cache::remember('route_plans.create_drivers', 3600, function () {
            return Driver::where('status', 'active')->get();
        });

        // Cache places (1 hour) - changes when places are added/removed
        $places = Cache::remember('route_plans.create_places', 3600, function () {
            return Place::orderBy('name')->get();
        });

        return Inertia::render('RoutePlans/Create', [
            'operations' => $operations,
            'trucks' => $trucks,
            'drivers' => $drivers,
            'places' => $places,
        ]);
    }

    /**
     * Store a newly created route plan.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'operation_id' => 'required|exists:operations,id',
                'truck_id' => 'required|exists:trucks,id',
                'driver_id' => 'required|exists:drivers,id',
                'planned_date' => 'required|date|after_or_equal:today',
                'planned_departure_time' => 'required|date_format:H:i',
                'planned_arrival_time' => 'required|date_format:H:i|after:planned_departure_time',
                'route_waypoints' => 'required|array|min:2',
                'route_waypoints.*' => 'exists:places,id',
                'total_distance_km' => 'required|numeric|min:0',
                'total_travel_time_minutes' => 'required|integer|min:1',
                'estimated_fuel_cost' => 'required|numeric|min:0',
                'notes' => 'nullable|string|max:1000',
            ]);

            $validated['user_id'] = auth()->id();
            $validated['status'] = 'planned';

            $routePlan = RoutePlan::create($validated);

            return redirect()->route('route-plans.index')
                ->with('success', 'Route plan created successfully.');

        } catch (Exception $e) {
            Log::error('Route plan creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create route plan. Please try again.']);
        }
    }

    /**
     * Display the specified route plan.
     */
    public function show(RoutePlan $routePlan): Response
    {
        $routePlan->load(['operation', 'truck', 'driver', 'user']);

        return Inertia::render('RoutePlans/Show', [
            'routePlan' => $routePlan,
        ]);
    }

    /**
     * Show the form for editing the specified route plan.
     */
    public function edit(RoutePlan $routePlan): Response
    {
        // Cache active operations (1 hour) - changes when operations are added/removed
        $operations = Cache::remember('route_plans.create_operations', 3600, function () {
            return Operation::where('status', 'active')->get();
        });

        // Cache active trucks (1 hour) - changes when trucks are added/removed
        $trucks = Cache::remember('route_plans.create_trucks', 3600, function () {
            return Truck::where('status', 'active')->get();
        });

        // Cache active drivers (1 hour) - changes when drivers are added/removed
        $drivers = Cache::remember('route_plans.create_drivers', 3600, function () {
            return Driver::where('status', 'active')->get();
        });

        // Cache places (1 hour) - changes when places are added/removed
        $places = Cache::remember('route_plans.create_places', 3600, function () {
            return Place::orderBy('name')->get();
        });

        return Inertia::render('RoutePlans/Edit', [
            'routePlan' => $routePlan,
            'operations' => $operations,
            'trucks' => $trucks,
            'drivers' => $drivers,
            'places' => $places,
        ]);
    }

    /**
     * Update the specified route plan.
     */
    public function update(Request $request, RoutePlan $routePlan)
    {
        try {
            $validated = $request->validate([
                'operation_id' => 'required|exists:operations,id',
                'truck_id' => 'required|exists:trucks,id',
                'driver_id' => 'required|exists:drivers,id',
                'planned_date' => 'required|date',
                'planned_departure_time' => 'required|date_format:H:i',
                'planned_arrival_time' => 'required|date_format:H:i|after:planned_departure_time',
                'route_waypoints' => 'required|array|min:2',
                'route_waypoints.*' => 'exists:places,id',
                'total_distance_km' => 'required|numeric|min:0',
                'total_travel_time_minutes' => 'required|integer|min:1',
                'estimated_fuel_cost' => 'required|numeric|min:0',
                'status' => 'required|string|in:planned,in_progress,completed,cancelled',
                'notes' => 'nullable|string|max:1000',
            ]);

            $routePlan->update($validated);

            return redirect()->route('route-plans.index')
                ->with('success', 'Route plan updated successfully.');

        } catch (Exception $e) {
            Log::error('Route plan update failed', [
                'route_plan_id' => $routePlan->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update route plan. Please try again.']);
        }
    }

    /**
     * Remove the specified route plan.
     */
    public function destroy(RoutePlan $routePlan)
    {
        try {
            // Check for related records that prevent deletion

            // Route plans are typically independent and can be safely deleted
            // as they only have BelongsTo relationships

            $routePlan->delete();

            return redirect()->route('route-plans.index')
                ->with('success', 'Route plan deleted successfully.');

        } catch (Exception $e) {
            Log::error('Route plan deletion failed', [
                'route_plan_id' => $routePlan->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete route plan. Please try again.']);
        }
    }

    /**
     * Optimize route between two places.
     */
    public function optimizeRoute(Request $request)
    {
        try {
            $originId = $request->get('origin_id');
            $destinationId = $request->get('destination_id');
            $truckId = $request->get('truck_id');

            if (!$originId || !$destinationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Origin and destination are required'
                ], 400);
            }

            // Get all possible routes between origin and destination
            $routes = Distance::where('orgion_id', $originId)
                ->where('destination_id', $destinationId)
                ->get();

            if ($routes->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No routes found between the specified places'
                ], 404);
            }

            // Calculate optimal route based on various factors
            $optimalRoute = $this->calculateOptimalRoute($routes, $truckId);

            return response()->json([
                'success' => true,
                'data' => $optimalRoute
            ]);

        } catch (Exception $e) {
            Log::error('Route optimization failed', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to optimize route'
            ], 500);
        }
    }

    /**
     * Get route analytics.
     */
    public function analytics(Request $request)
    {
        try {
            $truckId = $request->get('truck_id');
            $driverId = $request->get('driver_id');
            $startDate = $request->get('start_date', now()->subMonths(6));
            $endDate = $request->get('end_date', now());

            $query = RoutePlan::with(['operation', 'truck', 'driver'])
                ->whereBetween('planned_date', [$startDate, $endDate]);

            if ($truckId) {
                $query->where('truck_id', $truckId);
            }

            if ($driverId) {
                $query->where('driver_id', $driverId);
            }

            $analytics = $query->orderBy('planned_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $analytics,
                'count' => $analytics->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get route analytics', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve route analytics'
            ], 500);
        }
    }

    /**
     * Calculate optimal route based on various factors.
     */
    private function calculateOptimalRoute($routes, $truckId = null)
    {
        $bestRoute = null;
        $bestScore = -1;

        foreach ($routes as $route) {
            $score = 0;

            // Distance factor (shorter is better)
            $score += max(0, 100 - ($route->distance * 0.1));

            // Time factor (faster is better)
            if ($route->estimated_travel_time_minutes) {
                $score += max(0, 100 - ($route->estimated_travel_time_minutes * 0.2));
            }

            // Road condition factor (better condition is better)
            if ($route->road_condition_factor) {
                $score += $route->road_condition_factor * 50;
            }

            // Toll factor (no toll is better)
            if (!$route->toll_road) {
                $score += 20;
            }

            // Heavy vehicle restriction factor
            if (!$route->restricted_for_heavy_vehicles) {
                $score += 30;
            }

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestRoute = $route;
            }
        }

        return $bestRoute;
    }

    /**
     * Get route plan statistics.
     */
    private function getRoutePlanStatistics()
    {
        return [
            'total_plans' => RoutePlan::count(),
            'planned' => RoutePlan::where('status', 'planned')->count(),
            'in_progress' => RoutePlan::where('status', 'in_progress')->count(),
            'completed' => RoutePlan::where('status', 'completed')->count(),
            'cancelled' => RoutePlan::where('status', 'cancelled')->count(),
            'total_distance' => RoutePlan::sum('total_distance_km'),
            'total_fuel_cost' => RoutePlan::sum('estimated_fuel_cost'),
            'average_efficiency' => RoutePlan::avg('total_distance_km'),
        ];
    }
}



