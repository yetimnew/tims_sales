<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\Driver;
use App\Models\FuelRecord;
use App\Models\FuelConsumptionAnalysis;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Exception;
use Spatie\ActivityLog\Facades\Activity;

class FuelController extends Controller
{
    /**
     * Display a listing of fuel records.
     */
    public function index(Request $request): Response
    {
        $query = FuelRecord::with(['truck', 'driver', 'user']);

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('receipt_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('truck', function ($q) use ($search) {
                        $q->where('plate', 'like', "%{$search}%");
                    })
                    ->orWhereHas('driver', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'fuel_date');
        $direction = $request->input('direction', 'desc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['fuel_date', 'fuel_quantity_liters', 'total_cost', 'fuel_type', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'fuel_date';
        }

        $query->orderBy($sort, $direction);

        $fuelRecords = $query->paginate(15);
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
     * Export fuel records to CSV.
     */
    public function export(Request $request)
    {
        $query = FuelRecord::with(['truck', 'driver']);

        // Apply search filter if provided
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('receipt_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('truck', function ($q) use ($search) {
                        $q->where('plate', 'like', "%{$search}%");
                    })
                    ->orWhereHas('driver', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Apply sorting if provided
        $sort = $request->input('sort', 'fuel_date');
        $direction = $request->input('direction', 'desc');
        $allowedSorts = ['fuel_date', 'fuel_quantity_liters', 'total_cost', 'fuel_type', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        }

        $fuelRecords = $query->get();

        // Generate CSV
        $csvData = "Truck,Driver,Fuel Date,Fuel Type,Quantity Liters,Price Per Liter,Total Cost,Odometer,Receipt Number\n";
        foreach ($fuelRecords as $record) {
            $csvData .= sprintf(
                '"%s","%s","%s","%s","%.2f","%.2f","%.2f","%s","%s"' . "\n",
                $record->truck->plate ?? 'N/A',
                $record->driver->name ?? 'N/A',
                $record->fuel_date,
                $record->fuel_type,
                $record->fuel_quantity_liters,
                $record->fuel_price_per_liter,
                $record->total_cost,
                $record->odometer_reading ?? 'N/A',
                str_replace('"', '""', $record->receipt_number ?? '')
            );
        }

        // Log the export
        Activity::causedBy(auth()->user())
            ->withProperties(['count' => count($fuelRecords)])
            ->log('exported');

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="fuel-records.csv"');
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

            Activity::performedOn($fuelRecord)
                ->causedBy(auth()->user())
                ->log('created');

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record created successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create fuel record. Please try again.']);
        }
    }

    /**
     * Display the specified fuel record.
     */
    public function show(FuelRecord $fuel): Response
    {
        $fuel->load(['truck', 'driver', 'user']);

        // Load activity logs for this fuel record using Spatie Activity Log
        $activityLogs = Activity::forSubject($fuel)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Fuel/Show', [
            'fuel' => $fuel,
            'activityLogs' => $activityLogs,
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

            $oldData = $fuel->toArray();
            $fuel->update($validated);

            Activity::performedOn($fuel)
                ->causedBy(auth()->user())
                ->withProperties(['old' => $oldData, 'new' => $fuel->toArray()])
                ->log('updated');

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record updated successfully.');

        } catch (Exception $e) {
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

            Activity::performedOn($fuel)
                ->causedBy(auth()->user())
                ->withProperties(['deleted' => $fuelData])
                ->log('deleted');

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record deleted successfully.');

        } catch (Exception $e) {
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



