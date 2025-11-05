<?php

namespace App\Http\Controllers;

use App\Models\FuelRecord;
use App\Models\Truck;
use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FuelRecordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = FuelRecord::with(['driverTruck.truck', 'driverTruck.driver', 'user']);

        // Handle search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('fuel_station', 'like', "%{$search}%")
                    ->orWhere('fuel_type', 'like', "%{$search}%")
                    ->orWhere('receipt_number', 'like', "%{$search}%")
                    ->orWhereHas('driverTruck.truck', function ($truckQuery) use ($search) {
                        $truckQuery->where('plate', 'like', "%{$search}%");
                    })
                    ->orWhereHas('driverTruck.driver', function ($driverQuery) use ($search) {
                        $driverQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'fuel_date');
        $direction = $request->input('direction', 'desc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['fuel_date', 'fuel_quantity_liters', 'total_cost', 'fuel_station', 'fuel_type', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'fuel_date';
        }

        $query->orderBy($sort, $direction);

        $fuelRecords = $query->paginate(15);

        // Get statistics
        $statistics = [
            'total_records' => FuelRecord::count(),
            'total_cost' => FuelRecord::sum('total_cost'),
            'total_quantity' => FuelRecord::sum('fuel_quantity_liters'),
            'avg_price_per_liter' => FuelRecord::avg('fuel_price_per_liter'),
            'diesel_count' => FuelRecord::where('fuel_type', 'diesel')->count(),
            'petrol_count' => FuelRecord::where('fuel_type', 'petrol')->count(),
        ];

        return Inertia::render('FuelRecords/Index', [
            'fuelRecords' => $fuelRecords,
            'statistics' => $statistics,
            'filters' => [
                'search' => $request->input('search', ''),
                'sort' => $sort,
                'direction' => $direction,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $driverTrucks = \App\Models\DriverTruck::with(['truck', 'driver'])
            ->where('is_attached', true)
            ->whereNull('date_detach')
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'truck_plate' => $assignment->truck->plate ?? 'N/A',
                    'truck_model' => $assignment->truck->model ?? '',
                    'driver_name' => $assignment->driver->name ?? 'N/A',
                    'driver_license' => $assignment->driver->license_number ?? '',
                    'assigned_date' => $assignment->date_recived,
                ];
            });

        return Inertia::render('FuelRecords/Create', [
            'driverTrucks' => $driverTrucks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'driver_truck_id' => 'required|exists:driver_truck,id',
            'fuel_date' => 'required|date|before_or_equal:today',
            'fuel_quantity_liters' => 'required|numeric|min:0.01|max:999999.99',
            'fuel_price_per_liter' => 'required|numeric|min:0.01|max:999999.99',
            'total_cost' => 'required|numeric|min:0.01|max:999999999.99',
            'fuel_station' => 'required|string|max:255',
            'fuel_type' => 'required|in:diesel,petrol,gas',
            'odometer_reading' => 'nullable|integer|min:0|max:9999999',
            'receipt_number' => 'nullable|string|max:255|unique:fuel_records,receipt_number',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Calculate total cost if not provided or verify it matches calculation
        $calculatedTotal = $validated['fuel_quantity_liters'] * $validated['fuel_price_per_liter'];
        if (abs($validated['total_cost'] - $calculatedTotal) > 0.01) {
            return back()->withErrors([
                'total_cost' => 'Total cost does not match the calculation (quantity × price per liter).'
            ]);
        }

        $validated['user_id'] = Auth::id();

        try {
            $fuelRecord = FuelRecord::create($validated);

            if (Auth::check()) {
                activity()
                    ->performedOn($fuelRecord)
                    ->causedBy(Auth::user())
                    ->withProperties(['attributes' => $fuelRecord->toArray()])
                    ->log('created');
            }

            return redirect()->route('fuel-records.index')
                ->with('success', 'Fuel record created successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create fuel record. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(FuelRecord $fuelRecord): Response
    {
        $fuelRecord->load(['driverTruck.truck', 'driverTruck.driver', 'user']);

        return Inertia::render('FuelRecords/Show', [
            'fuelRecord' => $fuelRecord,
            'activityLogs' => $fuelRecord->activities()->with('causer')->latest()->take(50)->get(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(FuelRecord $fuelRecord): Response
    {
        $fuelRecord->load(['driverTruck.truck', 'driverTruck.driver', 'user']);

        $driverTrucks = \App\Models\DriverTruck::with(['truck', 'driver'])
            ->where('is_attached', true)
            ->whereNull('date_detach')
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'truck_plate' => $assignment->truck->plate ?? 'N/A',
                    'truck_model' => $assignment->truck->model ?? '',
                    'driver_name' => $assignment->driver->name ?? 'N/A',
                    'driver_license' => $assignment->driver->license_number ?? '',
                    'assigned_date' => $assignment->date_recived,
                ];
            });

        return Inertia::render('FuelRecords/Edit', [
            'fuelRecord' => $fuelRecord,
            'driverTrucks' => $driverTrucks,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, FuelRecord $fuelRecord)
    {
        $validated = $request->validate([
            'driver_truck_id' => 'required|exists:driver_truck,id',
            'fuel_date' => 'required|date|before_or_equal:today',
            'fuel_quantity_liters' => 'required|numeric|min:0.01|max:999999.99',
            'fuel_price_per_liter' => 'required|numeric|min:0.01|max:999999.99',
            'total_cost' => 'required|numeric|min:0.01|max:999999999.99',
            'fuel_station' => 'required|string|max:255',
            'fuel_type' => 'required|in:diesel,petrol,gas',
            'odometer_reading' => 'nullable|integer|min:0|max:9999999',
            'receipt_number' => 'nullable|string|max:255|unique:fuel_records,receipt_number,' . $fuelRecord->id,
            'notes' => 'nullable|string|max:1000',
        ]);

        // Calculate total cost if not provided or verify it matches calculation
        $calculatedTotal = $validated['fuel_quantity_liters'] * $validated['fuel_price_per_liter'];
        if (abs($validated['total_cost'] - $calculatedTotal) > 0.01) {
            return back()->withErrors([
                'total_cost' => 'Total cost does not match the calculation (quantity × price per liter).'
            ]);
        }

        try {
            $fuelRecord->update($validated);

            if (Auth::check()) {
                activity()
                    ->performedOn($fuelRecord)
                    ->causedBy(Auth::user())
                    ->withProperties(['old' => $fuelRecord->getOriginal(), 'attributes' => $fuelRecord->toArray()])
                    ->log('updated');
            }

            return redirect()->route('fuel-records.index')
                ->with('success', 'Fuel record updated successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update fuel record. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FuelRecord $fuelRecord)
    {
        try {
            if (Auth::check()) {
                activity()
                    ->performedOn($fuelRecord)
                    ->causedBy(Auth::user())
                    ->withProperties(['attributes' => $fuelRecord->toArray()])
                    ->log('deleted');
            }

            $fuelRecord->delete();

            return redirect()->route('fuel-records.index')
                ->with('success', 'Fuel record deleted successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete fuel record. Please try again.']);
        }
    }

    /**
     * Export fuel records to CSV.
     */
    public function export(Request $request)
    {
        $query = FuelRecord::with(['driverTruck.truck', 'driverTruck.driver', 'user']);

        // Apply search filter if provided
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('fuel_station', 'like', "%{$search}%")
                    ->orWhere('fuel_type', 'like', "%{$search}%")
                    ->orWhere('receipt_number', 'like', "%{$search}%")
                    ->orWhereHas('driverTruck.truck', function ($truckQuery) use ($search) {
                        $truckQuery->where('plate', 'like', "%{$search}%");
                    })
                    ->orWhereHas('driverTruck.driver', function ($driverQuery) use ($search) {
                        $driverQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Apply sorting if provided
        $sort = $request->input('sort', 'fuel_date');
        $direction = $request->input('direction', 'desc');
        $allowedSorts = ['fuel_date', 'fuel_quantity_liters', 'total_cost', 'fuel_station', 'fuel_type', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        }

        $fuelRecords = $query->get();

        // Generate CSV
        $csvData = "Date,Truck Plate,Driver,Fuel Station,Fuel Type,Quantity (L),Price/Liter,Total Cost,Odometer Reading,Receipt Number,Notes\n";
        foreach ($fuelRecords as $record) {
            $csvData .= sprintf(
                '"%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s"' . "\n",
                $record->fuel_date?->format('Y-m-d') ?? '',
                $record->driverTruck?->truck?->plate ?? '',
                $record->driverTruck?->driver?->name ?? '',
                str_replace('"', '""', $record->fuel_station ?? ''),
                $record->fuel_type ?? '',
                $record->fuel_quantity_liters ?? '',
                $record->fuel_price_per_liter ?? '',
                $record->total_cost ?? '',
                $record->odometer_reading ?? '',
                str_replace('"', '""', $record->receipt_number ?? ''),
                str_replace('"', '""', $record->notes ?? '')
            );
        }

        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['record_count' => $fuelRecords->count()])
                ->log('exported fuel records to CSV');
        }

        $filename = 'fuel-records-' . now()->format('Y-m-d-H-i-s') . '.csv';

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }
}
