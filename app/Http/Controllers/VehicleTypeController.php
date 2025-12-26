<?php

namespace App\Http\Controllers;

use App\Events\VehicleTypeCreated;
use App\Events\VehicleTypeDeleted;
use App\Events\VehicleTypeUpdated;
use App\Models\VehicleType;
use App\Services\VehicleTypes\VehicleTypeIndexService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class VehicleTypeController extends Controller
{
    public function __construct(private VehicleTypeIndexService $vehicleTypeIndexService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $result = $this->vehicleTypeIndexService->getIndexResult($request);

        return Inertia::render('VehicleTypes/Index', $result->toInertia());
    }

    /**
     * Export vehicle types to CSV.
     */
    public function export(Request $request)
    {
        $filters = $this->vehicleTypeIndexService->resolveFilters($request);

        $query = VehicleType::query()->withCount([
            'trucks',
            'trucks as active_trucks_count' => fn ($truckQuery) => $truckQuery->where('status', 'active'),
        ]);

        if ($filters->search !== null) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters->search}%")
                    ->orWhere('description', 'like', "%{$filters->search}%");
            });
        }

        $query->orderBy($filters->sort, $filters->direction);

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

            Cache::forget('trucks.vehicle_types'); // Clear cached vehicle types
            // Clear report caches
            Cache::forget('reports.performance_by_truck.vehicle_types');

            event(new VehicleTypeCreated($vehicleType, Auth::user()));

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type created successfully.');

        } catch (Exception $e) {
            $errorMessage = 'Failed to create vehicle type. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
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

            $original = $vehicletype->getOriginal();

            $vehicletype->fill($validated);

            $dirty = $vehicletype->getDirty();
            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            $vehicletype->save();

            Cache::forget('trucks.vehicle_types'); // Clear cached vehicle types
            // Clear report caches
            Cache::forget('reports.performance_by_truck.vehicle_types');

            if ($changes !== []) {
                event(new VehicleTypeUpdated($vehicletype->fresh(), $changes, Auth::user()));
            }

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type updated successfully.');

        } catch (Exception $e) {
            $errorMessage = 'Failed to update vehicle type. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
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
                $errorMessage = implode(' ', $blockers);

                return back()
                    ->withErrors(['error' => $blockers])
                    ->with('error', $errorMessage);
            }

            $vehicleTypeId = $vehicletype->getKey();
            $name = $vehicletype->name;
            $attributes = $vehicletype->getAttributes();

            $vehicletype->delete();

            Cache::forget('trucks.vehicle_types'); // Clear cached vehicle types
            // Clear report caches
            Cache::forget('reports.performance_by_truck.vehicle_types');

            event(new VehicleTypeDeleted($vehicleTypeId, $name, $attributes, Auth::user()));

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type deleted successfully.');

        } catch (Exception $e) {
            $errorMessage = 'Failed to delete vehicle type. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
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
