<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecalculateDriverTruckGradesRequest;
use App\Jobs\RecalculateDriverTruckGradeSnapshots;
use App\Models\DriverTruck;
use App\Models\DriverTruckGradeSnapshot;
use App\Models\DriverTruckGradingSetting;
use App\Services\DriverTruckGradeSnapshotService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class DriverTruckGradingSettingsController extends Controller
{
    public function __construct(
        private readonly DriverTruckGradeSnapshotService $snapshots,
    ) {}

    public function edit(Request $request): Response
    {
        $latest = DriverTruckGradingSetting::query()
            ->with('updatedBy:id,name')
            ->latest('updated_at')
            ->first();

        $defaults = DriverTruckGradingSetting::defaultWeights();
        $defaultThresholds = DriverTruckGradingSetting::defaultGradeThresholds();

        $active = array_merge(
            $defaults,
            ['grade_thresholds' => $defaultThresholds],
            $latest?->only(array_keys($defaults)) ?? [],
        );

        if ($latest) {
            $active['grade_thresholds'] = DriverTruckGradingSetting::normalizeGradeThresholds(
                $latest->grade_thresholds,
                $defaultThresholds,
            );
        }

        $perPageOptions = [10, 25, 50];
        $perPageInput = (int) $request->input('per_page', $perPageOptions[0]);
        $perPage = in_array($perPageInput, $perPageOptions, true) ? $perPageInput : $perPageOptions[0];

        $latestSnapshotDate = DriverTruckGradeSnapshot::query()
            ->orderByDesc('snapshot_date')
            ->value('snapshot_date');

        $snapshotDate = $this->resolveSnapshotDate(
            $request->input('snapshot_date'),
            $latestSnapshotDate ? Carbon::parse($latestSnapshotDate)->toDateString() : Carbon::now()->toDateString(),
        );

        $statusInput = $request->input('status');
        $status = $statusInput !== null && trim((string) $statusInput) !== '' ? trim((string) $statusInput) : null;

        $attachmentStateInput = $request->input('attachment_state');
        $attachmentState = $attachmentStateInput !== null && trim((string) $attachmentStateInput) !== ''
            ? strtolower(trim((string) $attachmentStateInput))
            : null;

        $gradeLetterInput = $request->input('grade_letter');
        $gradeLetter = $gradeLetterInput !== null && trim((string) $gradeLetterInput) !== ''
            ? strtoupper(trim((string) $gradeLetterInput))
            : null;

        $filteredSnapshotQuery = $this->applySnapshotFilters(
            DriverTruckGradeSnapshot::query(),
            $snapshotDate,
            $status,
            $attachmentState,
        );

        $latestSnapshot = (clone $filteredSnapshotQuery)
            ->with('calculatedBy:id,name')
            ->orderByDesc('calculated_at')
            ->first();

        $snapshotQuery = (clone $filteredSnapshotQuery)
            ->with([
                'assignment:id,driver_id,truck_id,is_attached,status,date_recived',
                'driver:id,name,driverid',
                'truck:id,plate',
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
            $paginator->getCollection()->map(function (DriverTruckGradeSnapshot $snapshot): array {
                $assignment = $snapshot->assignment;

                return [
                    'id' => $assignment?->id ?? $snapshot->driver_truck_id,
                    'driver' => $snapshot->driver?->only(['id', 'name', 'driverid']),
                    'truck' => $snapshot->truck?->only(['id', 'plate']),
                    'status' => $snapshot->status ?? $assignment?->status,
                    'is_attached' => $snapshot->is_attached,
                    'date_received' => $assignment?->date_recived?->toDateString(),
                    'grade' => [
                        'overall' => [
                            'score' => $snapshot->overall_score,
                            'letter' => $snapshot->overall_letter,
                        ],
                        'weights' => $snapshot->weights,
                        'categories' => $snapshot->categories,
                        'metrics' => $snapshot->metrics,
                        'grade_thresholds' => $snapshot->grade_thresholds,
                    ],
                    'snapshot' => [
                        'calculated_at' => $snapshot->calculated_at?->toIso8601String(),
                        'calculated_by' => $snapshot->calculatedBy?->only(['id', 'name']),
                    ],
                ];
            }),
        );

        $availableDates = DriverTruckGradeSnapshot::query()
            ->select('snapshot_date')
            ->distinct()
            ->orderByDesc('snapshot_date')
            ->limit(30)
            ->pluck('snapshot_date')
            ->map(static fn ($value) => Carbon::parse($value)->toDateString())
            ->values()
            ->all();

        $statuses = DriverTruck::query()
            ->select('status')
            ->whereNotNull('status')
            ->distinct()
            ->orderBy('status')
            ->pluck('status')
            ->filter(static fn (?string $value) => $value !== null && $value !== '')
            ->values()
            ->all();

        return Inertia::render('settings/driver-truck-grading', [
            'settings' => [
                'weights' => Arr::only($active, [
                    'performance_weight',
                    'efficiency_weight',
                    'consistency_weight',
                ]),
                'peer_sample_size' => $active['peer_sample_size'],
                'grade_thresholds' => $active['grade_thresholds'],
                'last_updated_at' => $latest?->updated_at?->toIso8601String(),
                'updated_by' => $latest?->updatedBy?->only(['id', 'name']),
            ],
            'can' => [
                'update' => $request->user()?->can('driver-trucks.update') ?? false,
                'recalculate' => $request->user()?->can('driver-trucks.update') ?? false,
            ],
            'driverTruckGrades' => $this->formatPaginator($paginator),
            'perPageOptions' => $perPageOptions,
            'filters' => [
                'snapshot_date' => $snapshotDate,
                'status' => $status,
                'attachment_state' => $attachmentState,
                'grade_letter' => $gradeLetter,
                'per_page' => $perPage,
            ],
            'filterOptions' => [
                'dates' => $availableDates,
                'statuses' => $statuses,
                'attachment_states' => ['attached', 'detached'],
            ],
            'latestCalculation' => $latestSnapshot ? [
                'calculated_at' => $latestSnapshot->calculated_at?->toIso8601String(),
                'calculated_by' => $latestSnapshot->calculatedBy?->only(['id', 'name']),
                'count' => (clone $filteredSnapshotQuery)->count(),
            ] : null,
        ]);
    }

    public function updateWeights(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('driver-trucks.update') ?? false, 403);

        $validator = Validator::make(
            $request->all(),
            [
                'performance_weight' => ['required', 'integer', 'min:0', 'max:100'],
                'efficiency_weight' => ['required', 'integer', 'min:0', 'max:100'],
                'consistency_weight' => ['required', 'integer', 'min:0', 'max:100'],
                'peer_sample_size' => ['required', 'integer', 'min:1', 'max:100'],
            ],
        );

        $validator->after(static function ($validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $sum = (int) ($validator->getData()['performance_weight'] ?? 0)
                + (int) ($validator->getData()['efficiency_weight'] ?? 0)
                + (int) ($validator->getData()['consistency_weight'] ?? 0);

            if ($sum !== 100) {
                $validator->errors()->add('weights', 'The combined weights must equal 100%.');
            }
        });

        $validated = $validator->validate();

        $payload = [
            'performance_weight' => (int) $validated['performance_weight'],
            'efficiency_weight' => (int) $validated['efficiency_weight'],
            'consistency_weight' => (int) $validated['consistency_weight'],
            'peer_sample_size' => (int) $validated['peer_sample_size'],
            'updated_by' => $request->user()?->id,
        ];

        $this->saveSettingAttributes($payload);
        $this->queueSnapshotRefresh($request->user()?->id);

        return to_route('settings.driver-truck-grading.edit')
            ->with('success', 'Driver-truck grading weights updated.');
    }

    public function updateGradeThresholds(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('driver-trucks.update') ?? false, 403);

        $validator = Validator::make(
            $request->all(),
            [
                'grade_thresholds' => ['required', 'array'],
                'grade_thresholds.A' => ['required', 'numeric', 'min:0', 'max:100'],
                'grade_thresholds.B' => ['required', 'numeric', 'min:0', 'max:100'],
                'grade_thresholds.C' => ['required', 'numeric', 'min:0', 'max:100'],
                'grade_thresholds.D' => ['required', 'numeric', 'min:0', 'max:100'],
                'grade_thresholds.E' => ['nullable', 'numeric', 'min:0', 'max:100'],
            ],
        );

        $validator->after(static function ($validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $thresholds = $validator->getData()['grade_thresholds'] ?? [];

            $previous = 100.0;

            foreach (['A', 'B', 'C', 'D'] as $letter) {
                $value = $thresholds[$letter] ?? null;

                if ($value === null || $value === '') {
                    $validator->errors()->add("grade_thresholds.$letter", sprintf('Grade %s threshold is required.', $letter));

                    return;
                }

                $numeric = (float) $value;

                if ($numeric > $previous) {
                    $validator->errors()->add('grade_thresholds', 'Each grade threshold must be less than or equal to the one preceding it.');

                    return;
                }

                $previous = $numeric;
            }

            $gradeE = $thresholds['E'] ?? null;

            if ($gradeE !== null && (float) $gradeE !== 0.0) {
                $validator->errors()->add('grade_thresholds.E', 'Grade E threshold must be 0.');
            }
        });

        $validated = $validator->validate();

        $payload = [
            'grade_thresholds' => DriverTruckGradingSetting::normalizeGradeThresholds(
                $validated['grade_thresholds'] ?? [],
            ),
            'updated_by' => $request->user()?->id,
        ];

        $this->saveSettingAttributes($payload);
        $this->queueSnapshotRefresh($request->user()?->id);

        return to_route('settings.driver-truck-grading.edit')
            ->with('success', 'Driver-truck grading grade thresholds updated.');
    }

    public function recalculate(RecalculateDriverTruckGradesRequest $request): RedirectResponse|JsonResponse
    {
        $filters = $request->filters();

        $snapshotDate = Carbon::parse($filters['snapshot_date'])->toDateString();
        $status = $filters['status'];
        $attachmentState = $filters['attachment_state'];

        $inserted = $this->snapshots->recalculateSnapshot(
            $snapshotDate,
            $status,
            $attachmentState,
            $request->user()?->id,
        );

        $redirectParams = array_filter([
            'snapshot_date' => $snapshotDate,
            'status' => $status,
            'attachment_state' => $attachmentState,
        ], static fn ($value) => $value !== null && $value !== '');

        $message = $inserted > 0
            ? sprintf('Stored %d driver-truck grade snapshots for %s.', $inserted, Carbon::parse($snapshotDate)->toFormattedDateString())
            : 'No assignments matched the selected filters, so no snapshot was stored.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'inserted' => $inserted,
                'filters' => [
                    'snapshot_date' => $snapshotDate,
                    'status' => $status,
                    'attachment_state' => $attachmentState,
                ],
            ]);
        }

        return to_route('settings.driver-truck-grading.edit', $redirectParams)
            ->with('success', $message);
    }

    private function saveSettingAttributes(array $attributes): void
    {
        $setting = DriverTruckGradingSetting::query()->latest('updated_at')->first();

        if ($setting) {
            $setting->forceFill($attributes)->save();

            return;
        }

        DriverTruckGradingSetting::create(array_merge(
            DriverTruckGradingSetting::defaultWeights(),
            ['grade_thresholds' => DriverTruckGradingSetting::defaultGradeThresholds()],
            $attributes,
        ));
    }

    private function queueSnapshotRefresh(?int $userId): void
    {
        $filterSets = $this->snapshots->distinctFilterSets()->all();

        RecalculateDriverTruckGradeSnapshots::dispatch($filterSets, $userId);
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

    private function resolveSnapshotDate(?string $input, string $fallback): string
    {
        if ($input === null || trim($input) === '') {
            return $fallback;
        }

        try {
            return Carbon::parse($input)->toDateString();
        } catch (\Throwable) {
            return $fallback;
        }
    }

    private function applySnapshotFilters(Builder $query, string $snapshotDate, ?string $status, ?string $attachmentState): Builder
    {
        $query->whereDate('snapshot_date', $snapshotDate);

        if ($status !== null) {
            $query->where('filter_status', $status);
        } else {
            $query->whereNull('filter_status');
        }

        $normalizedAttachment = $attachmentState !== null ? match ($attachmentState) {
            'attached' => true,
            'detached' => false,
            default => null,
        } : null;

        if ($normalizedAttachment === true) {
            $query->where('filter_is_attached', true);
        } elseif ($normalizedAttachment === false) {
            $query->where('filter_is_attached', false);
        } else {
            $query->whereNull('filter_is_attached');
        }

        return $query;
    }
}
