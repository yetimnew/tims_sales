<?php

namespace App\Http\Controllers;

use App\Models\Operation;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\RoutePlan;
use App\Models\Place;
use App\Models\Distance;
use Illuminate\Http\Request;
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

        $statistics = $this->getRoutePlanStatistics();

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
        $operations = Operation::where('status', 'active')->get();
        $trucks = Truck::where('status', 'active')->get();
        $drivers = Driver::where('status', 'active')->get();
        $places = Place::orderBy('name')->get();

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

            Log::info('Route plan created', [
                'route_plan_id' => $routePlan->id,
                'operation_id' => $routePlan->operation_id,
                'truck_id' => $routePlan->truck_id,
                'driver_id' => $routePlan->driver_id,
                'planned_date' => $routePlan->planned_date,
                'user_id' => auth()->id(),
            ]);

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
        $operations = Operation::where('status', 'active')->get();
        $trucks = Truck::where('status', 'active')->get();
        $drivers = Driver::where('status', 'active')->get();
        $places = Place::orderBy('name')->get();

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

            Log::info('Route plan updated', [
                'route_plan_id' => $routePlan->id,
                'operation_id' => $routePlan->operation_id,
                'truck_id' => $routePlan->truck_id,
                'driver_id' => $routePlan->driver_id,
                'status' => $routePlan->status,
                'user_id' => auth()->id(),
            ]);

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
            $routePlanData = $routePlan->toArray();
            $routePlan->delete();

            Log::info('Route plan deleted', [
                'route_plan_id' => $routePlan->id,
                'operation_id' => $routePlanData['operation_id'],
                'truck_id' => $routePlanData['truck_id'],
                'user_id' => auth()->id(),
            ]);

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



