<?php

namespace App\Http\Controllers;

use App\Http\Requests\Statuses\StoreStatusRequest;
use App\Http\Requests\Statuses\UpdateStatusRequest;
use App\Models\DailyTruckStatus;
use App\Models\Status;
use App\Models\StatusType;
use App\Services\Statuses\StatusIndexService;
use App\Services\StatusMetricsService;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class StatusController extends Controller
{
    public function __construct(
        private readonly StatusIndexService $statusIndexService,
        private readonly StatusMetricsService $statusMetricsService,
    ) {}

    public function index(Request $request): Response
    {
        $result = $this->statusIndexService->getIndexResult($request);

        return Inertia::render('Statuses/Index', $result->toInertia());
    }

    public function create(): Response
    {
        return Inertia::render('Statuses/Create', [
            'statusTypes' => $this->statusTypeOptions(),
        ]);
    }

    public function store(StoreStatusRequest $request): RedirectResponse
    {
        try {
            $validated = $request->validated();

            $status = Status::create([
                'name' => $validated['name'],
                'statustype_id' => (int) $validated['status_type_id'],
                'description' => $validated['description'] ?? null,
            ]);

            $this->clearCaches();

            Log::info('Status created', [
                'status_id' => $status->id,
                'name' => $status->name,
                'user_id' => Auth::id(),
            ]);

            return redirect()->route('statuses.index')
                ->with('success', 'Status created successfully.');

        } catch (Exception $e) {
            Log::error('Status creation failed', [
                'error' => $e->getMessage(),
                'payload' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create status. Please try again.']);
        }
    }

    public function show(Status $status): Response
    {
        $status->load('statusType:id,name');

        $resource = [
            'id' => $status->id,
            'name' => $status->name,
            'status_type_id' => $status->statustype_id,
            'statusType' => [
                'id' => $status->statusType?->id,
                'name' => $status->statusType?->name,
            ],
            'description' => $status->description,
            'created_at' => $status->created_at?->toIso8601String(),
            'updated_at' => $status->updated_at?->toIso8601String(),
        ];

        $activityLogs = Activity::forSubject($status)
            ->with('causer')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (Activity $activity) => $this->formatActivityLog($activity))
            ->values();

        return Inertia::render('Statuses/Show', [
            'status' => $resource,
            'activityLogs' => $activityLogs,
        ]);
    }

    public function edit(Status $status): Response
    {
        return Inertia::render('Statuses/Edit', [
            'status' => [
                'id' => $status->id,
                'name' => $status->name,
                'status_type_id' => $status->statustype_id,
                'description' => $status->description,
            ],
            'statusTypes' => $this->statusTypeOptions(),
        ]);
    }

    public function update(UpdateStatusRequest $request, Status $status): RedirectResponse
    {
        try {
            $validated = $request->validated();

            $status->fill([
                'name' => $validated['name'],
                'statustype_id' => (int) $validated['status_type_id'],
                'description' => $validated['description'] ?? null,
            ]);

            $dirty = $status->getDirty();
            unset($dirty['updated_at']);

            if ($status->isDirty()) {
                $status->save();
            }

            $this->clearCaches();

            if ($dirty !== []) {
                Log::info('Status updated', [
                    'status_id' => $status->id,
                    'changes' => $dirty,
                    'user_id' => Auth::id(),
                ]);
            }

            return redirect()->route('statuses.index')
                ->with('success', 'Status updated successfully.');

        } catch (Exception $e) {
            Log::error('Status update failed', [
                'status_id' => $status->id,
                'error' => $e->getMessage(),
                'payload' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update status. Please try again.']);
        }
    }

    public function destroy(Status $status): RedirectResponse
    {
        try {
            $usageCount = $status->dailyTruckStatuses()->count();

            if ($usageCount > 0) {
                return back()->withErrors([
                    'error' => 'Cannot delete status while it is used in daily truck statuses.',
                ]);
            }

            $statusId = $status->id;
            $statusName = $status->name;

            $status->delete();

            $this->clearCaches();

            Log::info('Status deleted', [
                'status_id' => $statusId,
                'name' => $statusName,
                'user_id' => Auth::id(),
            ]);

            return redirect()->route('statuses.index')
                ->with('success', 'Status deleted successfully.');

        } catch (Exception $e) {
            Log::error('Status deletion failed', [
                'status_id' => $status->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete status. Please try again.']);
        }
    }

    public function daily(Request $request, Status $status): Response
    {
        $date = $request->input('date', now()->format('Y-m-d'));

        $trucks = DailyTruckStatus::with(['truck' => fn ($query) => $query->select('id', 'plate')])
            ->where('status_id', $status->id)
            ->where('status_date', $date)
            ->orderByDesc('created_at')
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('Statuses/Daily', [
            'status' => [
                'id' => $status->id,
                'name' => $status->name,
            ],
            'date' => $date,
            'trucks' => $trucks,
        ]);
    }

    private function statusTypeOptions(): array
    {
        return StatusType::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(static fn (StatusType $statusType): array => [
                'id' => $statusType->id,
                'name' => $statusType->name,
            ])->all();
    }

    private function clearCaches(): void
    {
        $this->statusMetricsService->clearCache();
        Cache::forget('daily_truck_status.statuses');
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
