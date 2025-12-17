<?php

namespace App\Http\Controllers;

use App\Events\StatusTypeCreated;
use App\Events\StatusTypeDeleted;
use App\Events\StatusTypeUpdated;
use App\Http\Requests\StoreStatusTypeRequest;
use App\Http\Requests\UpdateStatusTypeRequest;
use App\Models\StatusType;
use App\Services\Statuses\StatusIndexService;
use App\Services\StatusMetricsService;
use App\Services\StatusTypeMetricsService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class StatusTypeController extends Controller
{
    public function __construct(
        private readonly StatusIndexService $statusIndexService,
        private readonly StatusTypeMetricsService $statusTypeMetricsService,
        private readonly StatusMetricsService $statusMetricsService,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $result = $this->statusIndexService->getIndexResult($request);

        return Inertia::render('Statuses/Index', $result->toInertia());
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('StatusTypes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreStatusTypeRequest $request)
    {
        try {
            $validated = $request->validated();

            $statusType = StatusType::create($validated);

            event(new StatusTypeCreated($statusType->fresh(), Auth::user()));

            $this->statusTypeMetricsService->clearCache();
            $this->statusMetricsService->clearCache();

            // Clear cached data
            Cache::forget('daily_truck_status.operational_status_type'); // Clear operational status type cache
            Cache::forget('daily_truck_status.statuses'); // Clear statuses cache

            Log::info('Status type created', [
                'status_type_id' => $statusType->id,
                'name' => $statusType->name,
                'user_id' => Auth::id(),
            ]);

            return redirect()->route('statustypes.index')
                ->with('success', 'Status type created successfully.');

        } catch (Exception $e) {
            Log::error('Status type creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create status type. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(StatusType $statusType): Response
    {
        $statusType->load(['statuses']);

        return Inertia::render('StatusTypes/Show', [
            'statusType' => $statusType,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(StatusType $statusType): Response
    {
        return Inertia::render('StatusTypes/Edit', [
            'statusType' => $statusType,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateStatusTypeRequest $request, StatusType $statusType)
    {
        try {
            $validated = $request->validated();

            $original = Arr::only($statusType->getOriginal(), ['name', 'description']);

            $statusType->fill($validated);

            $dirty = $statusType->getDirty();
            unset($dirty['updated_at']);

            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            if ($statusType->isDirty()) {
                $statusType->save();
            }

            if ($changes !== []) {
                event(new StatusTypeUpdated($statusType->fresh(), $changes, Auth::user()));
            }

            $this->statusTypeMetricsService->clearCache();
            $this->statusMetricsService->clearCache();

            // Clear cached data
            Cache::forget('daily_truck_status.operational_status_type'); // Clear operational status type cache
            Cache::forget('daily_truck_status.statuses'); // Clear statuses cache

            Log::info('Status type updated', [
                'status_type_id' => $statusType->id,
                'name' => $statusType->name,
                'user_id' => Auth::id(),
            ]);

            return redirect()->route('statustypes.index')
                ->with('success', 'Status type updated successfully.');

        } catch (Exception $e) {
            Log::error('Status type update failed', [
                'status_type_id' => $statusType->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update status type. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StatusType $statusType)
    {
        try {
            // Check if status type is being used by statuses
            if ($statusType->statuses()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete status type that has statuses.']);
            }

            $statusType->loadCount('statuses');
            $statusTypeData = $statusType->toArray();

            $metrics = [];
            $statusesCount = $statusType->getAttribute('statuses_count');

            if ($statusesCount !== null) {
                $metrics['statuses'] = (int) $statusesCount;
            }

            $statusTypeId = $statusType->id;
            $statusTypeName = $statusType->name;

            $statusType->delete();

            event(new StatusTypeDeleted(
                $statusTypeId,
                $statusTypeName,
                $statusTypeData,
                array_filter($metrics, static fn ($value) => $value !== null),
                Auth::user(),
            ));

            $this->statusTypeMetricsService->clearCache();
            $this->statusMetricsService->clearCache();

            // Clear cached data
            Cache::forget('daily_truck_status.operational_status_type'); // Clear operational status type cache
            Cache::forget('daily_truck_status.statuses'); // Clear statuses cache

            Log::info('Status type deleted', [
                'status_type_id' => $statusTypeId,
                'name' => $statusTypeData['name'],
                'user_id' => Auth::id(),
            ]);

            return redirect()->route('statustypes.index')
                ->with('success', 'Status type deleted successfully.');

        } catch (Exception $e) {
            Log::error('Status type deletion failed', [
                'status_type_id' => $statusType->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete status type. Please try again.']);
        }
    }
}
