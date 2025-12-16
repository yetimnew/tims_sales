<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\TruckFinancialRecord;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Facades\Activity as ActivityLogger;
use Spatie\Activitylog\Models\Activity;

class FinancialController extends Controller
{
    /**
     * Display a listing of financial records.
     */
    public function index(Request $request): Response
    {
        $query = TruckFinancialRecord::with(['truck']);

        // Handle search
        if ($request->has('search') && ! empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('truck', function ($q) use ($search) {
                    $q->where('plate', 'like', "%{$search}%");
                });
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'record_date');
        $direction = $request->input('direction', 'desc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['record_date', 'revenue', 'net_profit', 'period_type', 'created_at'];
        if (! in_array($sort, $allowedSorts)) {
            $sort = 'record_date';
        }

        $query->orderBy($sort, $direction);

        $financialRecords = $query->paginate(15);
        // Cache statistics for 5 minutes - they change frequently but don't need real-time accuracy
        $statistics = Cache::remember('financial.statistics', 300, fn () => $this->getFinancialStatistics());

        return Inertia::render('Financial/Index', [
            'financialRecords' => $financialRecords,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Show the form for creating a new financial record.
     */
    public function create(): Response
    {
        // Cache active trucks list (1 hour) - changes when trucks are added/removed
        $trucks = Cache::remember('financial.create_trucks', 3600, function () {
            return Truck::where('status', 'active')->get();
        });

        return Inertia::render('Financial/Create', [
            'trucks' => $trucks,
        ]);
    }

    /**
     * Store a newly created financial record.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'truck_id' => 'required|exists:trucks,id',
                'record_date' => 'required|date|before_or_equal:today',
                'revenue' => 'required|numeric|min:0',
                'fuel_cost' => 'required|numeric|min:0',
                'maintenance_cost' => 'required|numeric|min:0',
                'driver_salary' => 'required|numeric|min:0',
                'insurance_cost' => 'required|numeric|min:0',
                'depreciation' => 'required|numeric|min:0',
                'other_costs' => 'required|numeric|min:0',
                'period_type' => 'required|string|in:daily,weekly,monthly',
            ]);

            $validated['net_profit'] = $validated['revenue'] -
                ($validated['fuel_cost'] + $validated['maintenance_cost'] +
                 $validated['driver_salary'] + $validated['insurance_cost'] +
                 $validated['depreciation'] + $validated['other_costs']);

            $financialRecord = TruckFinancialRecord::create($validated);

            ActivityLogger::performedOn($financialRecord)
                ->causedBy(Auth::user())
                ->log('created');

            return redirect()->route('financial.index')
                ->with('success', 'Financial record created successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create financial record. Please try again.']);
        }
    }

    /**
     * Display the specified financial record.
     */
    public function show(TruckFinancialRecord $financial): Response
    {
        $financial->load(['truck']);

        // Load activity logs for this financial record using Spatie Activity Log
        $activityLogs = Activity::forSubject($financial)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Financial/Show', [
            'financial' => $financial,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified financial record.
     */
    public function edit(TruckFinancialRecord $financial): Response
    {
        // Cache active trucks list (1 hour) - changes when trucks are added/removed
        $trucks = Cache::remember('financial.create_trucks', 3600, function () {
            return Truck::where('status', 'active')->get();
        });

        return Inertia::render('Financial/Edit', [
            'financial' => $financial,
            'trucks' => $trucks,
        ]);
    }

    /**
     * Update the specified financial record.
     */
    public function update(Request $request, TruckFinancialRecord $financial)
    {
        try {
            $validated = $request->validate([
                'truck_id' => 'required|exists:trucks,id',
                'record_date' => 'required|date|before_or_equal:today',
                'revenue' => 'required|numeric|min:0',
                'fuel_cost' => 'required|numeric|min:0',
                'maintenance_cost' => 'required|numeric|min:0',
                'driver_salary' => 'required|numeric|min:0',
                'insurance_cost' => 'required|numeric|min:0',
                'depreciation' => 'required|numeric|min:0',
                'other_costs' => 'required|numeric|min:0',
                'period_type' => 'required|string|in:daily,weekly,monthly',
            ]);

            $validated['net_profit'] = $validated['revenue'] -
                ($validated['fuel_cost'] + $validated['maintenance_cost'] +
                 $validated['driver_salary'] + $validated['insurance_cost'] +
                 $validated['depreciation'] + $validated['other_costs']);

            $oldData = $financial->toArray();
            $financial->update($validated);

            ActivityLogger::performedOn($financial)
                ->causedBy(Auth::user())
                ->withProperties(['old' => $oldData, 'new' => $financial->toArray()])
                ->log('updated');

            return redirect()->route('financial.index')
                ->with('success', 'Financial record updated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update financial record. Please try again.']);
        }
    }

    /**
     * Remove the specified financial record.
     */
    public function destroy(TruckFinancialRecord $financial)
    {
        try {
            $financialData = $financial->toArray();
            $financial->delete();

            ActivityLogger::performedOn($financial)
                ->causedBy(Auth::user())
                ->withProperties(['deleted' => $financialData])
                ->log('deleted');

            return redirect()->route('financial.index')
                ->with('success', 'Financial record deleted successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete financial record. Please try again.']);
        }
    }

    /**
     * Get financial analytics.
     */
    public function analytics(Request $request)
    {
        try {
            $truckId = $request->get('truck_id');
            $periodType = $request->get('period_type', 'monthly');
            $startDate = $request->get('start_date', now()->subMonths(6));
            $endDate = $request->get('end_date', now());

            $query = TruckFinancialRecord::with(['truck'])
                ->where('period_type', $periodType)
                ->whereBetween('record_date', [$startDate, $endDate]);

            if ($truckId) {
                $query->where('truck_id', $truckId);
            }

            $analytics = $query->orderBy('record_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $analytics,
                'count' => $analytics->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve financial analytics',
            ], 500);
        }
    }

    /**
     * Get profit and loss statement.
     */
    public function profitLoss(Request $request)
    {
        try {
            $startDate = $request->get('start_date', now()->subMonths(12));
            $endDate = $request->get('end_date', now());

            $profitLoss = TruckFinancialRecord::whereBetween('record_date', [$startDate, $endDate])
                ->select(
                    DB::raw('SUM(revenue) as total_revenue'),
                    DB::raw('SUM(fuel_cost) as total_fuel_cost'),
                    DB::raw('SUM(maintenance_cost) as total_maintenance_cost'),
                    DB::raw('SUM(driver_salary) as total_driver_salary'),
                    DB::raw('SUM(insurance_cost) as total_insurance_cost'),
                    DB::raw('SUM(depreciation) as total_depreciation'),
                    DB::raw('SUM(other_costs) as total_other_costs'),
                    DB::raw('SUM(net_profit) as total_net_profit')
                )
                ->first();

            return response()->json([
                'success' => true,
                'data' => $profitLoss,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve profit and loss statement',
            ], 500);
        }
    }

    /**
     * Get financial statistics.
     */
    private function getFinancialStatistics()
    {
        return [
            'total_records' => TruckFinancialRecord::count(),
            'total_revenue' => TruckFinancialRecord::sum('revenue'),
            'total_costs' => TruckFinancialRecord::sum('fuel_cost') +
                            TruckFinancialRecord::sum('maintenance_cost') +
                            TruckFinancialRecord::sum('driver_salary') +
                            TruckFinancialRecord::sum('insurance_cost') +
                            TruckFinancialRecord::sum('depreciation') +
                            TruckFinancialRecord::sum('other_costs'),
            'total_profit' => TruckFinancialRecord::sum('net_profit'),
            'average_profit_margin' => TruckFinancialRecord::avg('net_profit'),
            'profitable_trucks' => TruckFinancialRecord::where('net_profit', '>', 0)->distinct('truck_id')->count(),
        ];
    }
}
