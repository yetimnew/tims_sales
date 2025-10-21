<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\Driver;
use App\Models\FuelRecord;
use App\Models\FuelConsumptionAnalysis;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class FuelController extends Controller
{
    /**
     * Display a listing of fuel records.
     */
    public function index(): Response
    {
        $fuelRecords = FuelRecord::with(['truck', 'driver', 'user'])
            ->orderBy('fuel_date', 'desc')
            ->paginate(15);

        $statistics = $this->getFuelStatistics();

        return Inertia::render('Fuel/Index', [
            'fuelRecords' => $fuelRecords,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Show the form for creating a new fuel record.
     */
    public function create(): Response
    {
        $trucks = Truck::where('status', 'active')->get();
        $drivers = Driver::where('status', 'active')->get();

        return Inertia::render('Fuel/Create', [
            'trucks' => $trucks,
            'drivers' => $drivers,
        ]);
    }

    /**
     * Store a newly created fuel record.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'truck_id' => 'required|exists:trucks,id',
                'driver_id' => 'required|exists:drivers,id',
                'fuel_date' => 'required|date|before_or_equal:today',
                'fuel_quantity_liters' => 'required|numeric|min:0.01|max:9999.99',
                'fuel_price_per_liter' => 'required|numeric|min:0.01|max:999.99',
                'fuel_station' => 'nullable|string|max:255',
                'fuel_type' => 'required|string|in:diesel,petrol,gas',
                'odometer_reading' => 'nullable|integer|min:0',
                'receipt_number' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
            ]);

            $validated['total_cost'] = $validated['fuel_quantity_liters'] * $validated['fuel_price_per_liter'];
            $validated['user_id'] = auth()->id();

            $fuelRecord = FuelRecord::create($validated);

            Log::info('Fuel record created', [
                'fuel_record_id' => $fuelRecord->id,
                'truck_id' => $fuelRecord->truck_id,
                'driver_id' => $fuelRecord->driver_id,
                'fuel_quantity' => $fuelRecord->fuel_quantity_liters,
                'total_cost' => $fuelRecord->total_cost,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record created successfully.');

        } catch (Exception $e) {
            Log::error('Fuel record creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create fuel record. Please try again.']);
        }
    }

    /**
     * Display the specified fuel record.
     */
    public function show(FuelRecord $fuel): Response
    {
        $fuel->load(['truck', 'driver', 'user']);

        return Inertia::render('Fuel/Show', [
            'fuel' => $fuel,
        ]);
    }

    /**
     * Show the form for editing the specified fuel record.
     */
    public function edit(FuelRecord $fuel): Response
    {
        $trucks = Truck::where('status', 'active')->get();
        $drivers = Driver::where('status', 'active')->get();

        return Inertia::render('Fuel/Edit', [
            'fuel' => $fuel,
            'trucks' => $trucks,
            'drivers' => $drivers,
        ]);
    }

    /**
     * Update the specified fuel record.
     */
    public function update(Request $request, FuelRecord $fuel)
    {
        try {
            $validated = $request->validate([
                'truck_id' => 'required|exists:trucks,id',
                'driver_id' => 'required|exists:drivers,id',
                'fuel_date' => 'required|date|before_or_equal:today',
                'fuel_quantity_liters' => 'required|numeric|min:0.01|max:9999.99',
                'fuel_price_per_liter' => 'required|numeric|min:0.01|max:999.99',
                'fuel_station' => 'nullable|string|max:255',
                'fuel_type' => 'required|string|in:diesel,petrol,gas',
                'odometer_reading' => 'nullable|integer|min:0',
                'receipt_number' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
            ]);

            $validated['total_cost'] = $validated['fuel_quantity_liters'] * $validated['fuel_price_per_liter'];

            $fuel->update($validated);

            Log::info('Fuel record updated', [
                'fuel_record_id' => $fuel->id,
                'truck_id' => $fuel->truck_id,
                'driver_id' => $fuel->driver_id,
                'fuel_quantity' => $fuel->fuel_quantity_liters,
                'total_cost' => $fuel->total_cost,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record updated successfully.');

        } catch (Exception $e) {
            Log::error('Fuel record update failed', [
                'fuel_record_id' => $fuel->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update fuel record. Please try again.']);
        }
    }

    /**
     * Remove the specified fuel record.
     */
    public function destroy(FuelRecord $fuel)
    {
        try {
            $fuelData = $fuel->toArray();
            $fuel->delete();

            Log::info('Fuel record deleted', [
                'fuel_record_id' => $fuel->id,
                'truck_id' => $fuelData['truck_id'],
                'driver_id' => $fuelData['driver_id'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record deleted successfully.');

        } catch (Exception $e) {
            Log::error('Fuel record deletion failed', [
                'fuel_record_id' => $fuel->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete fuel record. Please try again.']);
        }
    }

    /**
     * Get fuel consumption analysis.
     */
    public function analysis(Request $request)
    {
        try {
            $truckId = $request->get('truck_id');
            $periodType = $request->get('period_type', 'monthly');
            $startDate = $request->get('start_date', now()->subMonths(6));
            $endDate = $request->get('end_date', now());

            $query = FuelConsumptionAnalysis::with('truck')
                ->where('period_type', $periodType)
                ->whereBetween('analysis_date', [$startDate, $endDate]);

            if ($truckId) {
                $query->where('truck_id', $truckId);
            }

            $analysis = $query->orderBy('analysis_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'count' => $analysis->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get fuel consumption analysis', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve fuel consumption analysis'
            ], 500);
        }
    }

    /**
     * Generate fuel consumption analysis.
     */
    public function generateAnalysis(Request $request)
    {
        try {
            $truckId = $request->get('truck_id');
            $periodType = $request->get('period_type', 'monthly');
            $startDate = $request->get('start_date', now()->subMonths(6));
            $endDate = $request->get('end_date', now());

            $this->generateFuelConsumptionAnalysis($truckId, $periodType, $startDate, $endDate);

            return response()->json([
                'success' => true,
                'message' => 'Fuel consumption analysis generated successfully'
            ]);

        } catch (Exception $e) {
            Log::error('Failed to generate fuel consumption analysis', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate fuel consumption analysis'
            ], 500);
        }
    }

    /**
     * Get fuel statistics.
     */
    private function getFuelStatistics()
    {
        return [
            'total_records' => FuelRecord::count(),
            'total_fuel_consumed' => FuelRecord::sum('fuel_quantity_liters'),
            'total_cost' => FuelRecord::sum('total_cost'),
            'average_price_per_liter' => FuelRecord::avg('fuel_price_per_liter'),
            'diesel_records' => FuelRecord::where('fuel_type', 'diesel')->count(),
            'petrol_records' => FuelRecord::where('fuel_type', 'petrol')->count(),
            'gas_records' => FuelRecord::where('fuel_type', 'gas')->count(),
        ];
    }

    /**
     * Generate fuel consumption analysis for a truck.
     */
    private function generateFuelConsumptionAnalysis($truckId, $periodType, $startDate, $endDate)
    {
        $query = FuelRecord::whereBetween('fuel_date', [$startDate, $endDate]);

        if ($truckId) {
            $query->where('truck_id', $truckId);
        }

        $fuelRecords = $query->get();

        if ($fuelRecords->isEmpty()) {
            return;
        }

        $groupedRecords = $fuelRecords->groupBy(function ($record) use ($periodType) {
            if ($periodType === 'daily') {
                return $record->fuel_date->format('Y-m-d');
            } elseif ($periodType === 'weekly') {
                return $record->fuel_date->format('Y-W');
            } else {
                return $record->fuel_date->format('Y-m');
            }
        });

        foreach ($groupedRecords as $period => $records) {
            $totalFuel = $records->sum('fuel_quantity_liters');
            $totalCost = $records->sum('total_cost');
            $totalDistance = $records->sum(function ($record) {
                // This would need odometer readings to calculate actual distance
                return 0;
            });

            $fuelEfficiency = $totalDistance > 0 ? $totalDistance / $totalFuel : 0;
            $fuelCostPerKm = $totalDistance > 0 ? $totalCost / $totalDistance : 0;

            FuelConsumptionAnalysis::updateOrCreate([
                'truck_id' => $truckId,
                'analysis_date' => $records->first()->fuel_date,
                'period_type' => $periodType,
            ], [
                'total_distance_km' => $totalDistance,
                'total_fuel_consumed_liters' => $totalFuel,
                'fuel_efficiency_km_per_liter' => $fuelEfficiency,
                'fuel_cost_per_km' => $fuelCostPerKm,
            ]);
        }
    }
}



