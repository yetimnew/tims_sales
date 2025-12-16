<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class MaintenanceTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Handle search
        $query = MaintenanceType::query();

        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['name', 'category', 'interval_km', 'interval_months', 'estimated_cost', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $maintenanceTypes = $query->paginate(5);

        // Cache statistics (1 hour) - changes when types are added/removed/updated
        $statistics = Cache::remember('maintenance_types.statistics', 3600, function () {
            return [
                'total' => MaintenanceType::count(),
                'active' => MaintenanceType::where('is_active', true)->count(),
                'inactive' => MaintenanceType::where('is_active', false)->count(),
                'preventive' => MaintenanceType::where('category', 'Preventive')->count(),
                'corrective' => MaintenanceType::where('category', 'Corrective')->count(),
                'emergency' => MaintenanceType::where('category', 'Emergency')->count(),
            ];
        });

        return Inertia::render('MaintenanceTypes/Index', [
            'maintenanceTypes' => $maintenanceTypes,
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
    public function create()
    {
        return Inertia::render('MaintenanceTypes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:maintenance_types',
            'category' => 'required|string|in:Preventive,Corrective,Emergency',
            'interval_km' => 'nullable|integer|min:1',
            'interval_months' => 'nullable|integer|min:1',
            'estimated_cost' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $maintenanceType = MaintenanceType::create($validated);

        // Clear cached data
        Cache::forget('maintenance_types.statistics');
        Cache::forget('maintenance.maintenance_type_options');
        Cache::forget('maintenance.create_maintenance_types');
        // Clear report caches
        Cache::forget('reports.maintenance.maintenance_type_options');

        // Log the creation
        if (Auth::check()) {
            activity()
                ->performedOn($maintenanceType)
                ->causedBy(Auth::user())
                ->withProperties(['attributes' => $maintenanceType->toArray()])
                ->log('created');
        }

        return redirect()->route('maintenance-types.index')
            ->with('success', 'Maintenance type created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(MaintenanceType $maintenanceType)
    {
        $activityLogs = Activity::forSubject($maintenanceType)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('MaintenanceTypes/Show', [
            'maintenanceType' => $maintenanceType,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MaintenanceType $maintenanceType)
    {
        return Inertia::render('MaintenanceTypes/Edit', [
            'maintenanceType' => $maintenanceType,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MaintenanceType $maintenanceType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:maintenance_types,name,'.$maintenanceType->id,
            'category' => 'required|string|in:Preventive,Corrective,Emergency',
            'interval_km' => 'nullable|integer|min:1',
            'interval_months' => 'nullable|integer|min:1',
            'estimated_cost' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $oldAttributes = $maintenanceType->getAttributes();
        $maintenanceType->update($validated);

        // Clear cached data
        Cache::forget('maintenance_types.statistics');
        Cache::forget('maintenance.maintenance_type_options');
        Cache::forget('maintenance.create_maintenance_types');
        // Clear report caches
        Cache::forget('reports.maintenance.maintenance_type_options');

        // Log the update
        if (Auth::check()) {
            activity()
                ->performedOn($maintenanceType)
                ->causedBy(Auth::user())
                ->withProperties([
                    'old' => $oldAttributes,
                    'attributes' => $maintenanceType->getAttributes(),
                ])
                ->log('updated');
        }

        return redirect()->route('maintenance-types.show', $maintenanceType)
            ->with('success', 'Maintenance type updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MaintenanceType $maintenanceType)
    {
        try {
            if ($maintenanceType->maintenanceRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this maintenance type. It has '.$maintenanceType->maintenanceRecords()->count().' maintenance record(s) associated with it. Please reassign or delete all maintenance records first.',
                ]);
            }

            if (Auth::check()) {
                activity()
                    ->performedOn($maintenanceType)
                    ->causedBy(Auth::user())
                    ->withProperties(['attributes' => $maintenanceType->toArray()])
                    ->log('deleted');
            }

            $maintenanceType->delete();

            // Clear cached data
            Cache::forget('maintenance_types.statistics');
            Cache::forget('maintenance.maintenance_type_options');
            Cache::forget('maintenance.create_maintenance_types');
            // Clear report caches
            Cache::forget('reports.maintenance.maintenance_type_options');

            return redirect()->route('maintenance-types.index')
                ->with('success', 'Maintenance type deleted successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete maintenance type. Please try again.']);
        }
    }

    /**
     * Export maintenance types to CSV.
     */
    public function export(Request $request)
    {
        $query = MaintenanceType::query();

        if ($request->has('search') && ! empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');
        $allowedSorts = ['name', 'category', 'interval_km', 'interval_months', 'estimated_cost', 'is_active'];
        if (in_array($sort, $allowedSorts, true)) {
            $query->orderBy($sort, $direction);
        }

        $maintenanceTypes = $query->get();

        $csvData = "Name,Category,Interval KM,Interval Months,Estimated Cost,Description,Is Active\n";
        foreach ($maintenanceTypes as $type) {
            $csvData .= sprintf(
                '"%s","%s","%s","%s","%s","%s","%s"'."\n",
                $type->name,
                $type->category,
                $type->interval_km ?? '',
                $type->interval_months ?? '',
                $type->estimated_cost ?? '',
                str_replace('"', '""', $type->description ?? ''),
                $type->is_active ? 'Yes' : 'No'
            );
        }

        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['export_count' => $maintenanceTypes->count()])
                ->log('exported maintenance types to CSV');
        }

        $filename = 'maintenance-types-'.now()->format('Y-m-d-H-i-s').'.csv';

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="'.$filename.'"');
    }

    /**
     * Bulk delete maintenance types.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:maintenance_types,id',
        ]);

        try {
            $ids = $request->input('ids');
            $count = count($ids);

            $hasAssociations = false;
            foreach ($ids as $id) {
                $maintenanceType = MaintenanceType::find($id);
                if ($maintenanceType && $maintenanceType->maintenanceRecords()->count() > 0) {
                    $hasAssociations = true;
                    break;
                }
            }

            if ($hasAssociations) {
                return response()->json([
                    'error' => 'One or more selected maintenance types have associated maintenance records and cannot be deleted.',
                ], 422);
            }

            if (Auth::check()) {
                activity()
                    ->causedBy(Auth::user())
                    ->withProperties(['bulk_delete_ids' => $ids, 'count' => $count])
                    ->log('bulk deleted maintenance types');
            }

            MaintenanceType::whereIn('id', $ids)->delete();

            // Clear cached data
            Cache::forget('maintenance_types.statistics');
            Cache::forget('maintenance.maintenance_type_options');
            Cache::forget('maintenance.create_maintenance_types');

            return response()->json([
                'message' => "Successfully deleted {$count} maintenance type(s).",
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete maintenance types.'], 500);
        }
    }

    /**
     * Bulk activate maintenance types.
     */
    public function bulkActivate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:maintenance_types,id',
        ]);

        try {
            $ids = $request->input('ids');
            $count = count($ids);

            if (Auth::check()) {
                activity()
                    ->causedBy(Auth::user())
                    ->withProperties(['bulk_activate_ids' => $ids, 'count' => $count])
                    ->log('bulk activated maintenance types');
            }

            MaintenanceType::whereIn('id', $ids)->update(['is_active' => true]);

            // Clear cached data
            Cache::forget('maintenance_types.statistics');
            Cache::forget('maintenance.maintenance_type_options');
            Cache::forget('maintenance.create_maintenance_types');

            return response()->json([
                'message' => "Successfully activated {$count} maintenance type(s).",
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to activate maintenance types.'], 500);
        }
    }

    /**
     * Bulk deactivate maintenance types.
     */
    public function bulkDeactivate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:maintenance_types,id',
        ]);

        try {
            $ids = $request->input('ids');
            $count = count($ids);

            if (Auth::check()) {
                activity()
                    ->causedBy(Auth::user())
                    ->withProperties(['bulk_deactivate_ids' => $ids, 'count' => $count])
                    ->log('bulk deactivated maintenance types');
            }

            MaintenanceType::whereIn('id', $ids)->update(['is_active' => false]);

            // Clear cached data
            Cache::forget('maintenance_types.statistics');
            Cache::forget('maintenance.maintenance_type_options');
            Cache::forget('maintenance.create_maintenance_types');

            return response()->json([
                'message' => "Successfully deactivated {$count} maintenance type(s).",
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to deactivate maintenance types.'], 500);
        }
    }
}
