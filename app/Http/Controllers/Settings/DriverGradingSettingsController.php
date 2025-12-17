<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecalculateDriverGradesRequest;
use App\Http\Requests\UpdateDriverGradingSettingsRequest;
use App\Jobs\RecalculateDriverGradeSnapshots;
use App\Models\Driver;
use App\Models\DriverGradeSnapshot;
use App\Models\DriverGradingSetting;
use App\Services\DriverGradeSnapshotService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DriverGradingSettingsController extends Controller
{
    public function __construct(private readonly DriverGradeSnapshotService $snapshots) {}

    public function edit(Request $request): Response
    {
        $latest = DriverGradingSetting::query()
            ->with('updatedBy:id,name')
            ->latest('updated_at')
            ->first();

        $defaults = DriverGradingSetting::defaultWeights();
        $defaultThresholds = DriverGradingSetting::defaultGradeThresholds();

        $active = array_merge(
            $defaults,
            ['grade_thresholds' => $defaultThresholds],
            $latest?->only(array_keys($defaults)) ?? [],
        );

        if ($latest) {
            $active['grade_thresholds'] = DriverGradingSetting::normalizeGradeThresholds(
                $latest->grade_thresholds,
                $defaultThresholds,
            );
        }

        $perPageOptions = [10, 25, 50];
        $perPageInput = (int) $request->input('per_page', $perPageOptions[0]);
        $perPage = in_array($perPageInput, $perPageOptions, true) ? $perPageInput : $perPageOptions[0];

        $snapshotDate = $this->resolveSnapshotDate($request->string('snapshot_date')->toString());
        $statusInput = $request->input('status');
        $status = $statusInput !== null && trim((string) $statusInput) !== '' ? trim((string) $statusInput) : null;

        $gradeLetterInput = $request->input('grade_letter');
        $gradeLetter = $gradeLetterInput !== null && trim((string) $gradeLetterInput) !== ''
            ? strtoupper(trim((string) $gradeLetterInput))
            : null;

        $filteredSnapshotQuery = $this->applySnapshotFilters(
            DriverGradeSnapshot::query(),
            $snapshotDate,
            $status,
        );

        $latestSnapshot = (clone $filteredSnapshotQuery)
            ->with('calculatedBy:id,name')
            ->orderByDesc('calculated_at')
            ->first();

        $snapshotQuery = (clone $filteredSnapshotQuery)
            ->with([
                'driver:id,name,driverid,status,hireddate',
                'calculatedBy:id,name',
            ]);

        if ($gradeLetter) {
            $snapshotQuery->where('overall_letter', $gradeLetter);
        }

        $paginator = $snapshotQuery
            ->orderByDesc('overall_score')
            ->paginate($perPage)
            ->appends($request->query());

        $paginator->setCollection(
            $paginator->getCollection()->map(function (DriverGradeSnapshot $snapshot): array {
                $driver = $snapshot->driver;

                return [
                    'id' => $driver?->id ?? $snapshot->driver_id,
                    'name' => $driver?->name ?? '—',
                    'driverid' => $driver?->driverid,
                    'status' => $snapshot->status ?? $driver?->status,
                    'hire_date' => $driver?->hireddate?->toDateString(),
                    'grade' => [
                        'overall' => [
                            'score' => $snapshot->overall_score,
                            'letter' => $snapshot->overall_letter,
                        ],
                        'weights' => $snapshot->weights,
                        'grade_thresholds' => $snapshot->grade_thresholds,
                        'categories' => $snapshot->categories,
                        'metrics' => $snapshot->metrics,
                    ],
                    'snapshot' => [
                        'calculated_at' => $snapshot->calculated_at?->toIso8601String(),
                        'calculated_by' => $snapshot->calculatedBy?->only(['id', 'name']),
                    ],
                ];
            }),
        );

        $availableDates = DriverGradeSnapshot::query()
            ->select('snapshot_date')
            ->distinct()
            ->orderByDesc('snapshot_date')
            ->limit(30)
            ->pluck('snapshot_date')
            ->map(static fn ($value) => Carbon::parse($value)->toDateString())
            ->values()
            ->all();

        $statuses = Cache::remember('driver_grading_settings.statuses', 3600, function () {
            return Driver::query()
                ->whereNull('deleted_at')
                ->select('status')
                ->whereNotNull('status')
                ->distinct()
                ->orderBy('status')
                ->pluck('status')
                ->filter(static fn (?string $value) => $value !== null && $value !== '')
                ->values()
                ->all();
        });

        return Inertia::render('settings/driver-grading', [
            'settings' => [
                'weights' => Arr::only($active, [
                    'performance_weight',
                    'efficiency_weight',
                    'safety_weight',
                    'compliance_weight',
                    'engagement_weight',
                ]),
                'peer_sample_size' => $active['peer_sample_size'],
                'grade_thresholds' => $active['grade_thresholds'],
                'last_updated_at' => $latest?->updated_at?->toIso8601String(),
                'updated_by' => $latest?->updatedBy?->only(['id', 'name']),
            ],
            'can' => [
                'update' => $request->user()?->can('drivers.update') ?? false,
                'recalculate' => $request->user()?->can('drivers.update') ?? false,
            ],
            'driverGrades' => $this->formatPaginator($paginator),
            'filters' => [
                'snapshot_date' => $snapshotDate,
                'status' => $status,
                'grade_letter' => $gradeLetter,
                'per_page' => $perPage,
            ],
            'filterOptions' => [
                'dates' => $availableDates,
                'statuses' => $statuses,
            ],
            'latestCalculation' => $latestSnapshot ? [
                'calculated_at' => $latestSnapshot->calculated_at?->toIso8601String(),
                'calculated_by' => $latestSnapshot->calculatedBy?->only(['id', 'name']),
                'count' => (clone $filteredSnapshotQuery)->count(),
            ] : null,
            'perPageOptions' => $perPageOptions,
        ]);
    }

    public function update(UpdateDriverGradingSettingsRequest $request): RedirectResponse
    {
        $payload = array_merge(
            $request->weights(),
            [
                'grade_thresholds' => $request->gradeThresholds(),
                'updated_by' => $request->user()?->id,
            ],
        );

        $this->saveSettingAttributes($payload);
        $this->queueSnapshotRefresh($request->user()?->id);

        return to_route('settings.driver-grading.edit')
            ->with('success', 'Driver grading settings updated. Snapshot recalculation queued.');
    }

    public function recalculate(RecalculateDriverGradesRequest $request): RedirectResponse|JsonResponse
    {
        $filters = $request->filters();

        $snapshotDate = Carbon::parse($filters['snapshot_date'])->toDateString();
        $status = $filters['status'];

        $inserted = $this->snapshots->recalculateSnapshot(
            $snapshotDate,
            $status,
            $request->user()?->id,
        );

        $redirectParams = array_filter([
            'snapshot_date' => $snapshotDate,
            'status' => $status,
        ], static fn ($value) => $value !== null && $value !== '');

        $message = $inserted > 0
            ? sprintf('Stored %d driver grade snapshots for %s.', $inserted, Carbon::parse($snapshotDate)->toFormattedDateString())
            : 'No drivers matched the selected filters, so no snapshot was stored.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'inserted' => $inserted,
                'filters' => [
                    'snapshot_date' => $snapshotDate,
                    'status' => $status,
                ],
            ]);
        }

        return to_route('settings.driver-grading.edit', $redirectParams)
            ->with('success', $message);
    }

    private function resolveSnapshotDate(?string $candidate): string
    {
        if ($candidate) {
            try {
                return Carbon::parse($candidate)->toDateString();
            } catch (\Throwable) {
                // Ignore and fall back to today.
            }
        }

        return Carbon::now()->toDateString();
    }

    private function formatPaginator(LengthAwarePaginator $paginator): array
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
            'data' => $paginator->getCollection()->values()->all(),
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

    private function applySnapshotFilters(
        Builder $query,
        string $snapshotDate,
        ?string $status,
    ): \Illuminate\Database\Eloquent\Builder {
        $query->whereDate('snapshot_date', $snapshotDate);

        if ($status !== null) {
            $query->where('filter_status', $status);
        } else {
            $query->whereNull('filter_status');
        }

        return $query;
    }

    private function queueSnapshotRefresh(?int $userId): void
    {
        $filterSets = $this->snapshots->distinctFilterSets()->all();

        RecalculateDriverGradeSnapshots::dispatch($filterSets, $userId);
    }

    private function saveSettingAttributes(array $attributes): void
    {
        $setting = DriverGradingSetting::query()->latest('updated_at')->first();

        if ($setting) {
            $setting->forceFill($attributes)->save();

            return;
        }

        DriverGradingSetting::create(array_merge(
            DriverGradingSetting::defaultWeights(),
            ['grade_thresholds' => DriverGradingSetting::defaultGradeThresholds()],
            $attributes,
        ));
    }
}
