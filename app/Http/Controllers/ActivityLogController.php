<?php

namespace App\Http\Controllers;

use App\Exports\ActivityLogExport;
use App\Http\Requests\ActivityLogIndexRequest;
use App\Models\User;
use App\Support\ActivityLogQueryBuilder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ActivityLogController extends Controller
{
    public function index(ActivityLogIndexRequest $request): Response
    {
        $validated = $request->validated();
        $perPage = $this->resolvePerPage($validated);
        $sort = $this->extractSort($validated);
        $filters = $this->prepareFilters($validated);

        $paginator = ActivityLogQueryBuilder::build($filters, $sort)
            ->paginate($perPage)
            ->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(fn (Activity $activity): array => $this->presentActivity($activity))
        );

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $this->trimPagination($paginator),
            'metrics' => $this->metrics(),
            'filters' => [
                'from' => $request->input('from'),
                'to' => $request->input('to'),
                'causer_id' => $request->input('causer_id'),
                'action' => $request->input('action'),
                'log_name' => $request->input('log_name'),
                'subject_type' => $request->input('subject_type'),
                'search' => $request->input('search'),
                'sort' => $sort['column'],
                'direction' => $sort['direction'],
                'per_page' => $perPage,
            ],
            'filterOptions' => $this->filterOptions(),
            'sortOptions' => $this->sortOptions(),
            'perPageOptions' => $this->perPageOptions(),
        ]);
    }

    public function show(Activity $activity): Response
    {
        $activity->loadMissing(['causer:id,name,email', 'subject']);

        return Inertia::render('ActivityLogs/Show', [
            'activity' => $this->presentDetailedActivity($activity),
            'related' => $this->fetchRelatedActivities($activity),
        ]);
    }

    public function exportExcel(ActivityLogIndexRequest $request): BinaryFileResponse
    {
        $validated = $request->validated();
        $sort = $this->extractSort($validated);
        $filters = $this->prepareFilters($validated);

        return Excel::download(
            new ActivityLogExport($filters, $sort),
            'activity-logs-'.now()->format('Ymd_His').'.xlsx'
        );
    }

    public function exportCsv(ActivityLogIndexRequest $request): BinaryFileResponse
    {
        $validated = $request->validated();
        $sort = $this->extractSort($validated);
        $filters = $this->prepareFilters($validated);

        return Excel::download(
            new ActivityLogExport($filters, $sort),
            'activity-logs-'.now()->format('Ymd_His').'.csv',
            ExcelFormat::CSV
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function prepareFilters(array $payload): array
    {
        unset($payload['per_page'], $payload['sort'], $payload['direction']);

        if (isset($payload['causer_id'])) {
            $payload['causer_id'] = (int) $payload['causer_id'];
        }

        return array_filter($payload, static fn ($value) => $value !== null && $value !== '');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{column: string, direction: string}
     */
    private function extractSort(array &$payload): array
    {
        $column = Arr::get($payload, 'sort', 'created_at');
        $direction = Str::lower((string) Arr::get($payload, 'direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        unset($payload['sort'], $payload['direction']);

        $allowed = ['created_at', 'description', 'event', 'log_name', 'subject_type', 'causer_name'];

        if (! in_array($column, $allowed, true)) {
            $column = 'created_at';
        }

        return [
            'column' => $column,
            'direction' => $direction,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolvePerPage(array &$payload): int
    {
        $perPage = (int) Arr::get($payload, 'per_page', 25);
        $options = $this->perPageOptions();

        if (! in_array($perPage, $options, true)) {
            $perPage = $options[0];
        }

        unset($payload['per_page']);

        return $perPage;
    }

    private function perPageOptions(): array
    {
        return [15, 25, 50, 100];
    }

    private function presentActivity(Activity $activity): array
    {
        $base = collect($this->transformActivityLogs(collect([$activity])))->first() ?? [];

        return array_merge($base, [
            'log_name' => $activity->log_name,
            'event' => $activity->event ?? ($base['action'] ?? null),
            'subject_type' => $activity->subject_type,
            'subject_type_label' => $this->toSubjectLabel($activity->subject_type),
            'subject_id' => $activity->subject_id,
            'subject_label' => $this->resolveSubjectLabel($activity),
            'causer_id' => $activity->causer_id,
            'causer_name' => $activity->causer?->name ?? $activity->getAttribute('causer_name') ?? 'System',
            'causer' => $activity->causer ? [
                'id' => $activity->causer->id,
                'name' => $activity->causer->name,
                'email' => $activity->causer->email,
            ] : null,
            'batch_uuid' => $activity->batch_uuid,
            'changed_fields' => $this->extractChangedFields($base['old_values'] ?? null, $base['new_values'] ?? null),
        ]);
    }

    private function presentDetailedActivity(Activity $activity): array
    {
        $presented = $this->presentActivity($activity);

        $subject = $activity->subject;
        $presented['subject'] = $subject ? [
            'id' => $subject->getKey(),
            'type' => $activity->subject_type,
            'label' => $presented['subject_label'],
        ] : null;
        $presented['properties'] = [
            'old' => $presented['old_values'] ?? null,
            'new' => $presented['new_values'] ?? null,
        ];

        return $presented;
    }

    private function fetchRelatedActivities(Activity $activity): array
    {
        if (! $activity->subject_id || ! $activity->subject_type) {
            return [];
        }

        $related = Activity::query()
            ->where('subject_type', $activity->subject_type)
            ->where('subject_id', $activity->subject_id)
            ->whereKeyNot($activity->getKey())
            ->latest('created_at')
            ->limit(5)
            ->get();

        return $related
            ->map(fn (Activity $log): array => $this->presentActivity($log))
            ->values()
            ->all();
    }

    private function metrics(): array
    {
        // Cache metrics for 5 minutes - they change frequently but don't need real-time accuracy
        return Cache::remember('activity_logs.metrics', 300, function () {
            return [
                'total' => Activity::query()->count(),
                'last_24_hours' => Activity::query()->where('created_at', '>=', now()->subDay())->count(),
                'last_7_days' => Activity::query()->where('created_at', '>=', now()->subDays(7))->count(),
                'unique_users' => Activity::query()->whereNotNull('causer_id')->distinct('causer_id')->count('causer_id'),
            ];
        });
    }

    private function filterOptions(): array
    {
        // Cache filter options for 1 hour - they change infrequently
        return Cache::remember('activity_logs.filter_options', 3600, function () {
            $userIds = Activity::query()
                ->whereNotNull('causer_id')
                ->distinct()
                ->pluck('causer_id');

            $users = $userIds->isNotEmpty()
                ? User::query()
                    ->whereIn('id', $userIds)
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : collect();

            $actions = Activity::query()
                ->select('event')
                ->whereNotNull('event')
                ->distinct()
                ->orderBy('event')
                ->pluck('event');

            $logNames = Activity::query()
                ->select('log_name')
                ->whereNotNull('log_name')
                ->distinct()
                ->orderBy('log_name')
                ->pluck('log_name');

            $subjectTypes = Activity::query()
                ->select('subject_type')
                ->whereNotNull('subject_type')
                ->distinct()
                ->orderBy('subject_type')
                ->pluck('subject_type');

            return [
                'users' => $users->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                ])->values()->all(),
                'actions' => $actions->map(fn ($action) => [
                    'label' => Str::of($action)->replace('_', ' ')->headline(),
                    'value' => $action,
                ])->values()->all(),
                'log_names' => $logNames->map(fn ($log) => [
                    'label' => Str::headline((string) $log),
                    'value' => $log,
                ])->values()->all(),
                'subject_types' => $subjectTypes->map(fn ($subject) => [
                    'label' => $this->toSubjectLabel((string) $subject),
                    'value' => $subject,
                ])->values()->all(),
            ];
        });
    }

    private function sortOptions(): array
    {
        return [
            ['label' => 'Newest', 'value' => 'created_at'],
            ['label' => 'Action', 'value' => 'event'],
            ['label' => 'Description', 'value' => 'description'],
            ['label' => 'Log Name', 'value' => 'log_name'],
            ['label' => 'Subject', 'value' => 'subject_type'],
            ['label' => 'User', 'value' => 'causer_name'],
        ];
    }

    private function trimPagination(LengthAwarePaginator $paginator): array
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

    private function resolveSubjectLabel(Activity $activity): ?string
    {
        $subject = $activity->subject;

        if (! $subject) {
            return null;
        }

        foreach (['name', 'title', 'plate', 'description', 'id'] as $attribute) {
            $value = data_get($subject, $attribute);

            if ($value) {
                return (string) $value;
            }
        }

        if (method_exists($subject, '__toString')) {
            return (string) $subject;
        }

        return $subject->getKey() ? (string) $subject->getKey() : null;
    }

    private function toSubjectLabel(?string $subjectType): ?string
    {
        if (! $subjectType) {
            return null;
        }

        return Str::headline(class_basename($subjectType));
    }

    private function extractChangedFields(?array $oldValues, ?array $newValues): array
    {
        if (! is_array($oldValues) || ! is_array($newValues)) {
            return [];
        }

        $keys = array_unique(array_merge(array_keys($oldValues), array_keys($newValues)));

        return array_values(array_filter($keys, function (string $key) use ($oldValues, $newValues) {
            return ($oldValues[$key] ?? null) !== ($newValues[$key] ?? null);
        }));
    }
}
