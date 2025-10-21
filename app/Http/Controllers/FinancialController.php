<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\TruckFinancialRecord;
use App\Models\InsuranceRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class FinancialController extends Controller
{
    /**
     * Display a listing of financial records.
     */
    public function index(): Response
    {
        $financialRecords = TruckFinancialRecord::with(['truck'])
            ->orderBy('record_date', 'desc')
            ->paginate(15);

        $statistics = $this->getFinancialStatistics();

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
        $trucks = Truck::where('status', 'active')->get();

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

            Log::info('Financial record created', [
                'financial_record_id' => $financialRecord->id,
                'truck_id' => $financialRecord->truck_id,
                'revenue' => $financialRecord->revenue,
                'net_profit' => $financialRecord->net_profit,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('financial.index')
                ->with('success', 'Financial record created successfully.');

        } catch (Exception $e) {
            Log::error('Financial record creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create financial record. Please try again.']);
        }
    }

    /**
     * Display the specified financial record.
     */
    public function show(TruckFinancialRecord $financial): Response
    {
        $financial->load(['truck']);

        return Inertia::render('Financial/Show', [
            'financial' => $financial,
        ]);
    }

    /**
     * Show the form for editing the specified financial record.
     */
    public function edit(TruckFinancialRecord $financial): Response
    {
        $trucks = Truck::where('status', 'active')->get();

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

            $financial->update($validated);

            Log::info('Financial record updated', [
                'financial_record_id' => $financial->id,
                'truck_id' => $financial->truck_id,
                'revenue' => $financial->revenue,
                'net_profit' => $financial->net_profit,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('financial.index')
                ->with('success', 'Financial record updated successfully.');

        } catch (Exception $e) {
            Log::error('Financial record update failed', [
                'financial_record_id' => $financial->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

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

            Log::info('Financial record deleted', [
                'financial_record_id' => $financial->id,
                'truck_id' => $financialData['truck_id'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('financial.index')
                ->with('success', 'Financial record deleted successfully.');

        } catch (Exception $e) {
            Log::error('Financial record deletion failed', [
                'financial_record_id' => $financial->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

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
                'count' => $analytics->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get financial analytics', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve financial analytics'
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
                'data' => $profitLoss
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get profit and loss statement', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve profit and loss statement'
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

