<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecalculateTruckGradesRequest;
use App\Http\Requests\UpdateTruckGradingSettingsRequest;
use App\Jobs\RecalculateTruckGradeSnapshots;
use App\Models\Truck;
use App\Models\TruckGradeSnapshot;
use App\Models\TruckGradingSetting;
use App\Models\VehicleType;
use App\Rules\ValidGradeThresholds;
use App\Services\TruckGradeSnapshotService;
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

class TruckGradingSettingsController extends Controller
{
    public function __construct(private readonly TruckGradeSnapshotService $snapshots) {}

    public function edit(Request $request): Response
    {
        $latest = TruckGradingSetting::query()
            ->with('updatedBy:id,name')
            ->latest('updated_at')
            ->first();

        $defaults = TruckGradingSetting::defaultWeights();
        $defaultThresholds = TruckGradingSetting::defaultGradeThresholds();

        $active = array_merge(
            $defaults,
            ['grade_thresholds' => $defaultThresholds],
            $latest?->only(array_keys($defaults)) ?? [],
        );

        if ($latest) {
            $active['grade_thresholds'] = TruckGradingSetting::normalizeGradeThresholds(
                $latest->grade_thresholds,
                $defaultThresholds,
            );
        }

        $perPageOptions = [10, 25, 50];
        $perPageInput = (int) $request->input('per_page', $perPageOptions[0]);
        $perPage = in_array($perPageInput, $perPageOptions, true) ? $perPageInput : $perPageOptions[0];
        $gradeLetter = strtoupper((string) $request->input('grade_letter')) ?: null;

        $snapshotDate = Carbon::now()->toDateString();
        $snapshotDateInput = $request->input('snapshot_date');

        if ($snapshotDateInput) {
            try {
                $snapshotDate = Carbon::parse($snapshotDateInput)->toDateString();
            } catch (\Throwable) {
                $snapshotDate = Carbon::now()->toDateString();
            }
        }

        $vehicleTypeIdInput = $request->input('vehicle_type_id');
        $vehicleTypeId = is_numeric($vehicleTypeIdInput) && (int) $vehicleTypeIdInput > 0 ? (int) $vehicleTypeIdInput : null;

        $statusInput = $request->input('status');
        $status = $statusInput !== null && trim((string) $statusInput) !== '' ? trim((string) $statusInput) : null;

        $baseSnapshotQuery = TruckGradeSnapshot::query();
        $filteredSnapshotQuery = $this->applySnapshotFilters(
            clone $baseSnapshotQuery,
            $snapshotDate,
            $vehicleTypeId,
            $status,
        );

        $latestSnapshot = (clone $filteredSnapshotQuery)
            ->with('calculatedBy:id,name')
            ->orderByDesc('calculated_at')
            ->first();

        $snapshotQuery = (clone $filteredSnapshotQuery)
            ->with([
                'truck:id,plate,vehicletype_id,status,serviceStartDate,productionDate,purchasePrice',
                'truck.vehicleType:id,name',
                'vehicleType:id,name',
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
            $paginator->getCollection()->map(function (TruckGradeSnapshot $snapshot) {
                $truck = $snapshot->truck;
                $vehicleType = $truck?->vehicleType ?? $snapshot->vehicleType;

                return [
                    'id' => $truck?->id ?? $snapshot->truck_id,
                    'plate' => $truck?->plate ?? '—',
                    'status' => $snapshot->status ?? $truck?->status,
                    'vehicleType' => $vehicleType?->only(['id', 'name']),
                    'service_start_date' => $truck?->serviceStartDate?->toDateString(),
                    'production_date' => $truck?->productionDate?->toDateString(),
                    'purchase_price' => $truck?->purchasePrice !== null ? (float) $truck->purchasePrice : null,
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

        $availableDates = TruckGradeSnapshot::query()
            ->select('snapshot_date')
            ->distinct()
            ->orderByDesc('snapshot_date')
            ->limit(30)
            ->pluck('snapshot_date')
            ->map(static fn ($date) => Carbon::parse($date)->toDateString())
            ->values()
            ->all();

        $vehicleTypes = VehicleType::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (VehicleType $type) => [
                'id' => $type->id,
                'name' => $type->name,
            ])
            ->all();

        $statuses = Truck::query()
            ->select('status')
            ->whereNotNull('status')
            ->distinct()
            ->orderBy('status')
            ->pluck('status')
            ->filter(static fn (?string $value) => $value !== null && $value !== '')
            ->values()
            ->all();

        return Inertia::render('settings/truck-grading', [
            'settings' => [
                'weights' => Arr::only($active, [
                    'utilization_weight',
                    'efficiency_weight',
                    'reliability_weight',
                    'financial_weight',
                    'compliance_weight',
                ]),
                'peer_sample_size' => $active['peer_sample_size'],
                'grade_thresholds' => $active['grade_thresholds'],
                'last_updated_at' => $latest?->updated_at?->toIso8601String(),
                'updated_by' => $latest?->updatedBy?->only(['id', 'name']),
            ],
            'can' => [
                'update' => $request->user()?->can('trucks.update') ?? false,
                'recalculate' => $request->user()?->can('trucks.update') ?? false,
            ],
            'truckGrades' => $this->formatPaginator($paginator),
            'filters' => [
                'snapshot_date' => $snapshotDate,
                'vehicle_type_id' => $vehicleTypeId,
                'status' => $status,
                'grade_letter' => $gradeLetter,
                'per_page' => $perPage,
            ],
            'filterOptions' => [
                'dates' => $availableDates,
                'vehicle_types' => $vehicleTypes,
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

    public function update(UpdateTruckGradingSettingsRequest $request): RedirectResponse
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

        return to_route('settings.truck-grading.edit')
            ->with('success', 'Truck grading settings updated. Snapshot recalculation queued.');
    }

    public function updateWeights(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('trucks.update') ?? false, 403);

        $weightKeys = [
            'utilization_weight',
            'efficiency_weight',
            'reliability_weight',
            'financial_weight',
            'compliance_weight',
        ];

        $validator = Validator::make(
            $request->all(),
            [
                'utilization_weight' => ['required', 'integer', 'min:0', 'max:100'],
                'efficiency_weight' => ['required', 'integer', 'min:0', 'max:100'],
                'reliability_weight' => ['required', 'integer', 'min:0', 'max:100'],
                'financial_weight' => ['required', 'integer', 'min:0', 'max:100'],
                'compliance_weight' => ['required', 'integer', 'min:0', 'max:100'],
                'peer_sample_size' => ['required', 'integer', 'min:1', 'max:100'],
            ],
        );

        $validator->after(static function ($validator) use ($weightKeys): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $sum = 0;

            foreach ($weightKeys as $key) {
                $value = $validator->getData()[$key] ?? null;

                if ($value === null || $value === '') {
                    return;
                }

                $sum += (int) $value;
            }

            if ($sum !== 100) {
                $validator->errors()->add('weights', 'The combined weights must equal 100%.');
            }
        });

        $validated = $validator->validate();

        $payload = [
            'utilization_weight' => (int) $validated['utilization_weight'],
            'efficiency_weight' => (int) $validated['efficiency_weight'],
            'reliability_weight' => (int) $validated['reliability_weight'],
            'financial_weight' => (int) $validated['financial_weight'],
            'compliance_weight' => (int) $validated['compliance_weight'],
            'peer_sample_size' => (int) $validated['peer_sample_size'],
            'updated_by' => $request->user()?->id,
        ];

        $this->saveSettingAttributes($payload);
        $this->queueSnapshotRefresh($request->user()?->id);

        return to_route('settings.truck-grading.edit')
            ->with('success', 'Truck grading weights updated. Snapshot recalculation queued.');
    }

    public function updateGradeThresholds(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('trucks.update') ?? false, 403);

        $validated = Validator::make(
            $request->all(),
            ['grade_thresholds' => ['required', 'array', new ValidGradeThresholds]],
        )->validate();

        $payload = [
            'grade_thresholds' => TruckGradingSetting::normalizeGradeThresholds(
                $validated['grade_thresholds'] ?? [],
            ),
            'updated_by' => $request->user()?->id,
        ];

        $this->saveSettingAttributes($payload);
        $this->queueSnapshotRefresh($request->user()?->id);

        return to_route('settings.truck-grading.edit')
            ->with('success', 'Truck grading grade thresholds updated. Snapshot recalculation queued.');
    }

    public function recalculate(RecalculateTruckGradesRequest $request): RedirectResponse|JsonResponse
    {
        $filters = $request->filters();

        $snapshotDate = Carbon::parse($filters['snapshot_date'])->toDateString();
        $vehicleTypeId = $filters['vehicle_type_id'];
        $status = $filters['status'];

        $inserted = $this->snapshots->recalculateSnapshot(
            $snapshotDate,
            $vehicleTypeId,
            $status,
            $request->user()?->id,
        );

        $redirectParams = array_filter([
            'snapshot_date' => $snapshotDate,
            'vehicle_type_id' => $vehicleTypeId,
            'status' => $status,
        ], static fn ($value) => $value !== null && $value !== '');

        $message = $inserted > 0
            ? sprintf('Stored %d truck grade snapshots for %s.', $inserted, Carbon::parse($snapshotDate)->toFormattedDateString())
            : 'No trucks matched the selected filters, so no snapshot was stored.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'inserted' => $inserted,
                'filters' => [
                    'snapshot_date' => $snapshotDate,
                    'vehicle_type_id' => $vehicleTypeId,
                    'status' => $status,
                ],
            ]);
        }

        return to_route('settings.truck-grading.edit', $redirectParams)
            ->with('success', $message);
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

    private function applySnapshotFilters(Builder $query, string $snapshotDate, ?int $vehicleTypeId, ?string $status): Builder
    {
        $query->where('snapshot_date', $snapshotDate);

        if ($vehicleTypeId !== null) {
            $query->where('filter_vehicle_type_id', $vehicleTypeId);
        } else {
            $query->whereNull('filter_vehicle_type_id');
        }

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

        RecalculateTruckGradeSnapshots::dispatch($filterSets, $userId);
    }

    private function saveSettingAttributes(array $attributes): void
    {
        $setting = TruckGradingSetting::query()->latest('updated_at')->first();

        if ($setting) {
            $setting->forceFill($attributes)->save();

            return;
        }

        TruckGradingSetting::create(array_merge(
            TruckGradingSetting::defaultWeights(),
            ['grade_thresholds' => TruckGradingSetting::defaultGradeThresholds()],
            $attributes,
        ));
    }
}
