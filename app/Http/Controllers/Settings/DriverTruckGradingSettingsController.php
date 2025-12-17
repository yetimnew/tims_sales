<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecalculateDriverTruckGradesRequest;
use App\Jobs\RecalculateDriverTruckGradeSnapshots;
use App\Models\DriverTruck;
use App\Models\DriverTruckGradingSetting;
use App\Services\DriverTruckGradeService;
use App\Services\DriverTruckGradeSnapshotService;
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
        private readonly DriverTruckGradeService $grader,
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

        $assignmentsQuery = DriverTruck::query()
            ->with(['driver:id,name', 'truck:id,plate'])
            ->orderByDesc('date_recived');

        $paginator = $assignmentsQuery
            ->paginate($perPage)
            ->appends($request->query());

        $grades = $this->grader->gradeMany($paginator->getCollection());

        $sorted = $paginator->getCollection()
            ->map(function (DriverTruck $assignment) use ($grades) {
                $grade = $grades->get($assignment->id);

                return [
                    'id' => $assignment->id,
                    'driver' => $assignment->driver?->only(['id', 'name']),
                    'truck' => $assignment->truck?->only(['id', 'plate']),
                    'date_received' => $assignment->date_recived?->toDateString(),
                    'status' => $assignment->status,
                    'is_attached' => (bool) $assignment->is_attached,
                    'grade' => $grade ? [
                        'overall' => $grade['overall'] ?? null,
                        'weights' => $grade['weights'] ?? null,
                        'categories' => $grade['categories'] ?? null,
                        'grade_thresholds' => $grade['grade_thresholds'] ?? null,
                    ] : null,
                ];
            })
            ->sortByDesc(static function (array $assignment): float {
                return (float) ($assignment['grade']['overall']['score'] ?? -INF);
            })
            ->values();

        $paginator->setCollection($sorted);

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
            'assignments' => $this->formatPaginator($paginator),
            'perPageOptions' => $perPageOptions,
            'filters' => [
                'per_page' => $perPage,
            ],
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
}
