<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceType;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class MaintenanceTypeController extends Controller
{
    private const PER_PAGE_OPTIONS = [15, 25, 50, 100];

    private const DEFAULT_PER_PAGE = 15;

    private const DEFAULT_SORT = 'created_at';

    /**
     * @var array<int, string>
     */
    private const ALLOWED_SORTS = [
        'name',
        'category',
        'interval_km',
        'interval_months',
        'estimated_cost',
        'is_active',
        'created_at',
    ];

    /**
     * @var array<int, array{label: string, value: string}>
     */
    private const STATUS_OPTIONS = [
        ['label' => 'Active', 'value' => 'active'],
        ['label' => 'Inactive', 'value' => 'inactive'],
    ];

    private const CACHE_KEY_METRICS = 'maintenance_types.metrics';

    private const CACHE_KEY_CATEGORY_DATA = 'maintenance_types.category_data';

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status');
        $category = $request->input('category');
        $sort = $request->input('sort', self::DEFAULT_SORT);
        $direction = strtolower((string) $request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $perPageInput = (int) $request->input('per_page', self::DEFAULT_PER_PAGE);
        $perPage = in_array($perPageInput, self::PER_PAGE_OPTIONS, true) ? $perPageInput : self::DEFAULT_PER_PAGE;

        if (! in_array($sort, self::ALLOWED_SORTS, true)) {
            $sort = self::DEFAULT_SORT;
        }

        $query = MaintenanceType::query()
            ->when($search !== '', function ($builder) use ($search) {
                $builder->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn ($builder) => $builder->where('is_active', true))
            ->when($status === 'inactive', fn ($builder) => $builder->where('is_active', false))
            ->when($category && $category !== 'all', fn ($builder) => $builder->where('category', $category));

        $paginator = $query
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->appends($request->only(['search', 'status', 'category', 'sort', 'direction', 'per_page']));

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (MaintenanceType $maintenanceType): array {
                return [
                    'id' => $maintenanceType->id,
                    'name' => $maintenanceType->name,
                    'category' => $maintenanceType->category,
                    'interval_km' => $maintenanceType->interval_km,
                    'interval_months' => $maintenanceType->interval_months,
                    'estimated_cost' => $maintenanceType->estimated_cost !== null
                        ? (float) $maintenanceType->estimated_cost
                        : null,
                    'is_active' => (bool) $maintenanceType->is_active,
                    'description' => $maintenanceType->description,
                    'created_at' => $maintenanceType->created_at?->toDateTimeString(),
                    'updated_at' => $maintenanceType->updated_at?->toDateTimeString(),
                ];
            })
        );

        $categoryData = Cache::remember(self::CACHE_KEY_CATEGORY_DATA, 3600, function () {
            return MaintenanceType::query()
                ->select('category')
                ->selectRaw('COUNT(*) as count')
                ->groupBy('category')
                ->orderBy('category')
                ->get()
                ->map(static function ($row): array {
                    return [
                        'label' => $row->category,
                        'value' => $row->category,
                        'count' => (int) $row->count,
                    ];
                })
                ->values()
                ->all();
        });

        $categoryOptions = array_map(static fn (array $item): array => [
            'label' => $item['label'],
            'value' => $item['value'],
        ], $categoryData);

        $categoryCounts = [];

        foreach ($categoryData as $item) {
            $categoryCounts[$item['value']] = $item['count'];
        }

        $metrics = Cache::remember(self::CACHE_KEY_METRICS, 3600, function () use ($categoryCounts): array {
            $aggregate = MaintenanceType::query()
                ->selectRaw('COUNT(*) as total_count')
                ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count')
                ->selectRaw('SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_count')
                ->selectRaw('AVG(interval_km) as avg_interval_km')
                ->selectRaw('AVG(interval_months) as avg_interval_months')
                ->selectRaw('AVG(estimated_cost) as avg_estimated_cost')
                ->selectRaw('SUM(estimated_cost) as total_estimated_cost')
                ->first();

            return [
                'counts' => [
                    'total' => (int) ($aggregate?->total_count ?? 0),
                    'active' => (int) ($aggregate?->active_count ?? 0),
                    'inactive' => (int) ($aggregate?->inactive_count ?? 0),
                ],
                'categories' => array_map(
                    static fn (string $label, int $count): array => [
                        'label' => $label,
                        'value' => $label,
                        'count' => $count,
                    ],
                    array_keys($categoryCounts),
                    array_values($categoryCounts)
                ),
                'intervals' => [
                    'average_km' => $aggregate?->avg_interval_km !== null
                        ? (float) $aggregate->avg_interval_km
                        : null,
                    'average_months' => $aggregate?->avg_interval_months !== null
                        ? (float) $aggregate->avg_interval_months
                        : null,
                ],
                'costs' => [
                    'average' => $aggregate?->avg_estimated_cost !== null
                        ? (float) $aggregate->avg_estimated_cost
                        : null,
                    'total' => $aggregate?->total_estimated_cost !== null
                        ? (float) $aggregate->total_estimated_cost
                        : null,
                ],
            ];
        });

        $filters = [
            'search' => $search !== '' ? $search : null,
            'status' => in_array($status, ['active', 'inactive'], true) ? $status : null,
            'category' => $category && $category !== 'all' ? $category : null,
            'sort' => $sort,
            'direction' => $direction,
            'per_page' => $perPage,
        ];

        return Inertia::render('MaintenanceTypes/Index', [
            'maintenanceTypes' => $this->presentPaginator($paginator),
            'metrics' => $metrics,
            'filters' => $filters,
            'statusOptions' => self::STATUS_OPTIONS,
            'categoryOptions' => $categoryOptions,
            'perPageOptions' => self::PER_PAGE_OPTIONS,
        ]);
    }

    /**
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, mixed>, links: array<int, array<string, mixed>>}
     */
    private function presentPaginator(LengthAwarePaginator $paginator): array
    {
        $links = $paginator->linkCollection()->map(static function (array $link): array {
            $label = $link['label'];

            if (is_string($label)) {
                $label = trim(strip_tags(html_entity_decode($label)));
            }

            return [
                'url' => $link['url'],
                'label' => $label,
                'active' => (bool) $link['active'],
            ];
        })->values()->all();

        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'links' => $links,
        ];
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
        Cache::forget(self::CACHE_KEY_METRICS);
        Cache::forget(self::CACHE_KEY_CATEGORY_DATA);
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
        Cache::forget(self::CACHE_KEY_METRICS);
        Cache::forget(self::CACHE_KEY_CATEGORY_DATA);
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
            $recordCount = $maintenanceType->maintenanceRecords()->count();

            if ($recordCount > 0) {
                $errorMessage = 'You are not allowed to delete this maintenance type. It has '.$recordCount.' maintenance record(s) associated with it. Please reassign or delete all maintenance records first.';

                return back()
                    ->withErrors(['error' => $errorMessage])
                    ->with('error', $errorMessage);
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
            Cache::forget(self::CACHE_KEY_METRICS);
            Cache::forget(self::CACHE_KEY_CATEGORY_DATA);
            Cache::forget('maintenance.maintenance_type_options');
            Cache::forget('maintenance.create_maintenance_types');
            // Clear report caches
            Cache::forget('reports.maintenance.maintenance_type_options');

            return redirect()->route('maintenance-types.index')
                ->with('success', 'Maintenance type deleted successfully.');
        } catch (\Exception $e) {
            $errorMessage = 'Failed to delete maintenance type. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
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
            Cache::forget(self::CACHE_KEY_METRICS);
            Cache::forget(self::CACHE_KEY_CATEGORY_DATA);
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
            Cache::forget(self::CACHE_KEY_METRICS);
            Cache::forget(self::CACHE_KEY_CATEGORY_DATA);
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
            Cache::forget(self::CACHE_KEY_METRICS);
            Cache::forget(self::CACHE_KEY_CATEGORY_DATA);
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
