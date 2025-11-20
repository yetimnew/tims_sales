<?php

namespace App\Http\Controllers;

use App\Models\VehicleType;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class VehicleTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $sort = $request->input('sort', 'created_at');
        $direction = strtolower((string) $request->input('direction', 'desc'));
        $perPageOptions = [15, 25, 50, 100];
        $perPageDefault = 15;
        $perPage = (int) $request->input('per_page', $perPageDefault);

        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $allowedSorts = ['name', 'trucks_count', 'active_trucks_count', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'created_at';
        }

        $baseQuery = VehicleType::query();

        if ($search !== '') {
            $baseQuery->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $listingQuery = (clone $baseQuery)->withCount([
            'trucks',
            'trucks as active_trucks_count' => fn ($query) => $query->where('status', 'active'),
        ]);

        $vehicleTypes = $listingQuery
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $metricsBase = clone $baseQuery;
        $totalTypes = (clone $metricsBase)->count();
        $typesWithTrucks = (clone $metricsBase)->whereHas('trucks')->count();
        $totalTrucks = (clone $metricsBase)
            ->withCount('trucks')
            ->get()
            ->sum('trucks_count');
        $activeTrucks = (clone $metricsBase)
            ->withCount([
                'trucks as active_trucks_count' => fn ($query) => $query->where('status', 'active'),
            ])
            ->get()
            ->sum('active_trucks_count');

        $metrics = [
            'total' => $totalTypes,
            'with_trucks' => $typesWithTrucks,
            'without_trucks' => max($totalTypes - $typesWithTrucks, 0),
            'total_trucks' => $totalTrucks,
            'active_trucks' => $activeTrucks,
        ];

        return Inertia::render('VehicleTypes/Index', [
            'vehicleTypes' => $vehicleTypes,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'perPageOptions' => $perPageOptions,
        ]);
    }

    /**
     * Export vehicle types to CSV.
     */
    public function export(Request $request)
    {
        $query = VehicleType::query()->withCount([
            'trucks',
            'trucks as active_trucks_count' => fn ($truckQuery) => $truckQuery->where('status', 'active'),
        ]);

        // Apply search filter if provided
        if ($request->has('search') && ! empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply sorting if provided
        $sort = $request->input('sort', 'created_at');
        $direction = strtolower((string) $request->input('direction', 'desc'));
        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }
        $allowedSorts = ['name', 'trucks_count', 'active_trucks_count', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'created_at';
        }

        $query->orderBy($sort, $direction);

        $vehicleTypes = $query->get();

        // Generate CSV
        $csvData = "Name,Description,Trucks Count,Active Trucks,Created Date\n";
        foreach ($vehicleTypes as $type) {
            $csvData .= sprintf(
                '"%s","%s","%s","%s","%s"'."\n",
                $type->name,
                str_replace('"', '""', $type->description ?? ''),
                $type->trucks_count,
                $type->active_trucks_count,
                $type->created_at
            );
        }

        // Log the export
        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['count' => count($vehicleTypes)])
                ->log('exported vehicle types to CSV');
        }

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="vehicle-types.csv"');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('VehicleTypes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:vehicletypes',
                'description' => 'nullable|string|max:1000',
            ]);

            $vehicleType = VehicleType::create($validated);

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type created successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create vehicle type. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(VehicleType $vehicletype): Response
    {
        $vehicletype->load([
            'trucks' => fn ($query) => $query
                ->select('id', 'vehicletype_id', 'plate', 'status', 'created_at')
                ->latest('created_at'),
        ]);

        // Load activity logs for this vehicle type using Spatie Activity Log
        $activityLogs = Activity::forSubject($vehicletype)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Activity $activity) => $this->formatActivityLog($activity))
            ->values();

        $vehicleType = [
            'id' => $vehicletype->id,
            'name' => $vehicletype->name,
            'description' => $vehicletype->description,
            'created_at' => $vehicletype->created_at?->toIso8601String(),
            'updated_at' => $vehicletype->updated_at?->toIso8601String(),
            'trucks' => [
                'data' => $vehicletype->trucks
                    ->map(fn ($truck) => [
                        'id' => $truck->id,
                        'plate' => $truck->plate,
                        'status' => $truck->status,
                        'created_at' => $truck->created_at?->toIso8601String(),
                    ])
                    ->values(),
            ],
        ];

        return Inertia::render('VehicleTypes/Show', [
            'vehicleType' => $vehicleType,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(VehicleType $vehicletype): Response
    {
        return Inertia::render('VehicleTypes/Edit', [
            'vehicleType' => $vehicletype,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VehicleType $vehicletype)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:vehicletypes,name,'.$vehicletype->id,
                'description' => 'nullable|string|max:1000',
            ]);

            $vehicletype->update($validated);

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type updated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update vehicle type. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VehicleType $vehicletype)
    {
        try {
            $blockers = [];

            $truckCount = $vehicletype->trucks()->count();
            if ($truckCount > 0) {
                $blockers[] = 'Unable to delete this vehicle type because '.$truckCount.' truck(s) currently reference it. Reassign or delete those trucks first.';
            }

            if (! empty($blockers)) {
                return back()->withErrors([
                    'error' => $blockers,
                ]);
            }

            $vehicletype->delete();

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type deleted successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete vehicle type. Please try again.']);
        }
    }

    private function formatActivityLog(Activity $activity): array
    {
        $event = $activity->event;
        $description = (string) ($activity->description ?? '');

        $action = match ($event) {
            'created', 'updated', 'deleted' => $event,
            default => null,
        };

        if ($action === null) {
            $lowerDescription = Str::lower($description);

            if (Str::contains($lowerDescription, ['delete', 'removed'])) {
                $action = 'deleted';
            } elseif (Str::contains($lowerDescription, ['create', 'added'])) {
                $action = 'created';
            } else {
                $action = 'updated';
            }
        }

        $properties = $activity->properties?->toArray() ?? [];

        return [
            'id' => $activity->id,
            'action' => $action,
            'description' => $description !== '' ? $description : Str::headline($action ?? 'activity'),
            'user' => $activity->causer ? [
                'name' => $activity->causer->name,
            ] : null,
            'created_at' => $activity->created_at?->toIso8601String(),
            'old_values' => $properties['old'] ?? null,
            'new_values' => $properties['attributes'] ?? null,
        ];
    }
}
