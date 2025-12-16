<?php

namespace App\Http\Controllers;

use App\Events\OutsourceCreated;
use App\Events\OutsourceDeleted;
use App\Events\OutsourceUpdated;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OutsourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $perPageOptions = [10, 15, 25, 50];

        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));
        $serviceType = trim((string) $request->input('service_type', ''));

        $applyFilters = static function ($query) use ($search, $status, $serviceType) {
            if ($search !== '') {
                $query->where(function ($builder) use ($search) {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('contact_person', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($status !== '' && $status !== 'all') {
                $query->where('status', $status);
            }

            if ($serviceType !== '' && $serviceType !== 'all') {
                $query->where('service_type', $serviceType);
            }
        };

        $listingQuery = Outsource::query();
        $applyFilters($listingQuery);
        $listingQuery->withCount('outsourcePerformances');

        $allowedSortColumns = [
            'name',
            'contact_person',
            'phone',
            'email',
            'service_type',
            'status',
            'outsource_performances_count',
            'created_at',
        ];

        $sortColumn = $request->get('sort', 'name');
        if (! in_array($sortColumn, $allowedSortColumns, true)) {
            $sortColumn = 'name';
        }

        $direction = $request->get('direction', 'asc');
        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'asc';
        }

        $listingQuery->orderBy($sortColumn, $direction);

        $perPage = (int) $request->get('per_page', 15);
        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = 15;
        }

        $metricsQuery = Outsource::query();
        $applyFilters($metricsQuery);

        $outsources = $listingQuery
            ->paginate($perPage)
            ->withQueryString();

        $totalVendors = (clone $metricsQuery)->count();
        $activeVendors = (clone $metricsQuery)->where('status', 'active')->count();
        $totalTrips = OutsourcePerformance::query()
            ->whereHas('outsource', static function ($query) use ($applyFilters) {
                $applyFilters($query);
            })
            ->count();
        $serviceCategoryCount = (clone $metricsQuery)
            ->whereNotNull('service_type')
            ->distinct('service_type')
            ->count('service_type');

        $metrics = [
            'totalVendors' => $totalVendors,
            'activeVendors' => $activeVendors,
            'averageTripsPerVendor' => $totalVendors > 0 ? round($totalTrips / $totalVendors, 1) : 0,
            'serviceCategoryCount' => $serviceCategoryCount,
        ];

        // Cache status options (1 hour) - rarely changes
        $statusOptions = Cache::remember('outsources.status_options', 3600, function () {
            return Outsource::query()
                ->select('status')
                ->distinct()
                ->orderBy('status')
                ->pluck('status')
                ->filter()
                ->map(fn ($status) => [
                    'label' => Str::headline((string) $status),
                    'value' => $status,
                ])
                ->values()
                ->all();
        });

        // Cache service type options (1 hour) - rarely changes
        $serviceTypeOptions = Cache::remember('outsources.service_type_options', 3600, function () {
            return Outsource::query()
                ->select('service_type')
                ->whereNotNull('service_type')
                ->distinct()
                ->orderBy('service_type')
                ->pluck('service_type')
                ->map(fn ($type) => [
                    'label' => Str::headline((string) $type),
                    'value' => $type,
                ])
                ->values()
                ->all();
        });

        $filters = [
            'search' => $search !== '' ? $search : null,
            'status' => $status !== '' ? $status : null,
            'service_type' => $serviceType !== '' ? $serviceType : null,
            'sort' => $sortColumn,
            'direction' => $direction,
            'per_page' => $perPage,
        ];

        return Inertia::render('Outsources/Index', [
            'outsources' => $outsources,
            'metrics' => $metrics,
            'filters' => $filters,
            'statusOptions' => $statusOptions,
            'serviceTypeOptions' => $serviceTypeOptions,
            'perPageOptions' => $perPageOptions,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $statusOptions = [
            ['label' => 'Active', 'value' => 'active'],
            ['label' => 'Inactive', 'value' => 'inactive'],
        ];

        // Cache service type options (1 hour)
        $serviceTypeOptions = Cache::remember('outsources.service_type_options', 3600, function () {
            return Outsource::query()
                ->select('service_type')
                ->whereNotNull('service_type')
                ->distinct()
                ->orderBy('service_type')
                ->pluck('service_type')
                ->filter()
                ->map(fn ($type) => [
                    'label' => Str::headline((string) $type),
                    'value' => (string) $type,
                ])
                ->values()
                ->all();
        });

        return Inertia::render('Outsources/Create', [
            'statusOptions' => $statusOptions,
            'serviceTypeOptions' => $serviceTypeOptions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'contact_person' => 'required|string|max:255',
                'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9\s\-\+\(\)]{7,}$/'],
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string|max:500',
                'service_type' => 'nullable|string|max:255',
                'status' => 'nullable|string|in:active,inactive',
            ]);

            foreach (['phone', 'email', 'address', 'service_type'] as $nullableField) {
                if (($validated[$nullableField] ?? null) === '') {
                    $validated[$nullableField] = null;
                }
            }

            $validated['status'] = $validated['status'] ?? 'active';

            $actor = Auth::user();

            $outsource = Outsource::create($validated);

            Log::info('Outsource created', [
                'outsource_id' => $outsource->id,
                'name' => $outsource->name,
                'user_id' => Auth::id(),
            ]);

            event(new OutsourceCreated($outsource->fresh(), $actor));

            // Clear cached options
            Cache::forget('outsources.status_options');
            Cache::forget('outsources.service_type_options');
            Cache::forget('outsource_performances.outsource_options'); // Clear outsource performances options
            // Clear report caches
            Cache::forget('reports.outsource_performance.vendor_options');

            return redirect()->route('outsources.index')
                ->with('success', 'Outsource created successfully.');

        } catch (Exception $e) {
            Log::error('Outsource creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create outsource. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Outsource $outsource): Response
    {
        $outsource->loadCount('outsourcePerformances');

        $basePerformanceQuery = OutsourcePerformance::query()
            ->where('outsource_id', $outsource->id);

        $recentPerformances = (clone $basePerformanceQuery)
            ->with([
                'fromPlace:id,name',
                'toPlace:id,name',
            ])
            ->orderByDesc('dispatch_date')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (OutsourcePerformance $performance) => [
                'id' => $performance->id,
                'trip_number' => $performance->trip_number,
                'dispatch_date' => optional($performance->dispatch_date)->toDateString(),
                'status' => $performance->status,
                'distance_km' => $performance->distance_km ? (float) $performance->distance_km : null,
                'cargo_volume_mt' => $performance->cargo_volume_mt ? (float) $performance->cargo_volume_mt : null,
                'cost' => $performance->cost ? (float) $performance->cost : null,
                'from_place' => $performance->fromPlace?->name,
                'to_place' => $performance->toPlace?->name,
            ])
            ->values()
            ->all();

        $metrics = [
            'totalTrips' => (clone $basePerformanceQuery)->count(),
            'activeTrips' => (clone $basePerformanceQuery)->where('status', 'active')->count(),
            'totalDistance' => (float) ((clone $basePerformanceQuery)->sum('distance_km') ?? 0.0),
            'totalCost' => (float) ((clone $basePerformanceQuery)->sum('cost') ?? 0.0),
        ];

        $outsourceData = [
            'id' => $outsource->id,
            'name' => $outsource->name,
            'contact_person' => $outsource->contact_person,
            'phone' => $outsource->phone,
            'email' => $outsource->email,
            'address' => $outsource->address,
            'service_type' => $outsource->service_type,
            'status' => $outsource->status,
            'outsource_performances_count' => $outsource->outsource_performances_count,
            'created_at' => optional($outsource->created_at)->toDateTimeString(),
            'updated_at' => optional($outsource->updated_at)->toDateTimeString(),
        ];

        return Inertia::render('Outsources/Show', [
            'outsource' => $outsourceData,
            'metrics' => $metrics,
            'recentPerformances' => $recentPerformances,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Outsource $outsource): Response
    {
        $statusOptions = [
            ['label' => 'Active', 'value' => 'active'],
            ['label' => 'Inactive', 'value' => 'inactive'],
        ];

        // Cache service type options (1 hour)
        $serviceTypeOptions = Cache::remember('outsources.service_type_options', 3600, function () {
            return Outsource::query()
                ->select('service_type')
                ->whereNotNull('service_type')
                ->distinct()
                ->orderBy('service_type')
                ->pluck('service_type')
                ->filter()
                ->map(fn ($type) => [
                    'label' => Str::headline((string) $type),
                    'value' => (string) $type,
                ])
                ->values()
                ->all();
        });

        $outsourceData = [
            'id' => $outsource->id,
            'name' => $outsource->name,
            'contact_person' => $outsource->contact_person,
            'phone' => $outsource->phone,
            'email' => $outsource->email,
            'address' => $outsource->address,
            'service_type' => $outsource->service_type,
            'status' => $outsource->status,
        ];

        return Inertia::render('Outsources/Edit', [
            'outsource' => $outsourceData,
            'statusOptions' => $statusOptions,
            'serviceTypeOptions' => $serviceTypeOptions,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Outsource $outsource)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'contact_person' => 'required|string|max:255',
                'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9\s\-\+\(\)]{7,}$/'],
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string|max:500',
                'service_type' => 'nullable|string|max:255',
                'status' => 'nullable|string|in:active,inactive',
            ]);

            foreach (['phone', 'email', 'address', 'service_type'] as $nullableField) {
                if (($validated[$nullableField] ?? null) === '') {
                    $validated[$nullableField] = null;
                }
            }

            $validated['status'] = $validated['status'] ?? $outsource->status ?? 'active';

            $actor = Auth::user();

            $original = $outsource->getOriginal();
            $outsource->fill($validated);

            $changes = [];

            foreach ($outsource->getDirty() as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            if ($changes !== []) {
                $outsource->save();
            }

            Log::info('Outsource updated', [
                'outsource_id' => $outsource->id,
                'name' => $outsource->name,
                'user_id' => Auth::id(),
            ]);

            if ($changes !== []) {
                event(new OutsourceUpdated($outsource->fresh(), $changes, $actor));
            }

            // Clear cached options if status or service_type changed
            if (isset($changes['status']) || isset($changes['service_type'])) {
                Cache::forget('outsources.status_options');
                Cache::forget('outsources.service_type_options');
                Cache::forget('outsource_performances.outsource_options'); // Clear outsource performances options
                Cache::forget('reports.outsource_performance.vendor_options'); // Clear report cache
            }

            return redirect()->route('outsources.index')
                ->with('success', 'Outsource updated successfully.');

        } catch (Exception $e) {
            Log::error('Outsource update failed', [
                'outsource_id' => $outsource->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update outsource. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Outsource $outsource)
    {
        try {
            // Check if outsource is being used in performances
            if ($outsource->outsourcePerformances()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete outsource that has performances.']);
            }

            $actor = Auth::user();

            $outsourceData = $outsource->toArray();
            $outsourceId = $outsource->getKey();
            $outsourceName = $outsource->name;

            $outsource->delete();

            Log::info('Outsource deleted', [
                'outsource_id' => $outsource->id,
                'name' => $outsourceData['name'],
                'user_id' => Auth::id(),
            ]);

            event(new OutsourceDeleted($outsourceId, $outsourceName, $outsourceData, $actor));

            // Clear cached options
            Cache::forget('outsources.status_options');
            Cache::forget('outsources.service_type_options');
            Cache::forget('outsource_performances.outsource_options'); // Clear outsource performances options
            // Clear report caches
            Cache::forget('reports.outsource_performance.vendor_options');

            return redirect()->route('outsources.index')
                ->with('success', 'Outsource deleted successfully.');

        } catch (Exception $e) {
            Log::error('Outsource deletion failed', [
                'outsource_id' => $outsource->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete outsource. Please try again.']);
        }
    }
}
