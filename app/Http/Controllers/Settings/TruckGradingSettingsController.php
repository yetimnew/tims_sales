<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecalculateTruckGradesRequest;
use App\Http\Requests\UpdateTruckGradingSettingsRequest;
use App\Models\Truck;
use App\Models\TruckGradeSnapshot;
use App\Models\TruckGradingSetting;
use App\Models\VehicleType;
use App\Services\TruckGradeService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use JsonException;

class TruckGradingSettingsController extends Controller
{
    public function __construct(private TruckGradeService $truckGrade) {}

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
        $weights = $request->weights();

        $payload = array_merge($weights, [
            'grade_thresholds' => $request->gradeThresholds(),
            'updated_by' => $request->user()?->id,
        ]);

        $setting = TruckGradingSetting::query()->latest('updated_at')->first();

        if ($setting) {
            $setting->forceFill($payload)->save();
        } else {
            TruckGradingSetting::create($payload);
        }

        return to_route('settings.truck-grading.edit')
            ->with('success', 'Truck grading settings updated successfully.');
    }

    public function recalculate(RecalculateTruckGradesRequest $request): RedirectResponse
    {
        $filters = $request->filters();

        $snapshotDate = Carbon::parse($filters['snapshot_date'])->toDateString();
        $vehicleTypeId = $filters['vehicle_type_id'];
        $status = $filters['status'];

        $userId = $request->user()?->id;
        $calculatedAt = Carbon::now();

        $truckQuery = Truck::query()
            ->select(['id', 'vehicletype_id', 'status'])
            ->when($vehicleTypeId, static fn (Builder $query, int $id) => $query->where('vehicletype_id', $id))
            ->when($status, static fn (Builder $query, string $value) => $query->where('status', $value))
            ->orderBy('id');

        $inserted = 0;

        DB::transaction(function () use ($truckQuery, $snapshotDate, $vehicleTypeId, $status, $userId, $calculatedAt, &$inserted) {
            $deleteQuery = $this->applySnapshotFilters(
                TruckGradeSnapshot::query(),
                $snapshotDate,
                $vehicleTypeId,
                $status,
            );

            $deleteQuery->delete();

            $truckQuery->chunkById(100, function ($chunk) use ($snapshotDate, $vehicleTypeId, $status, $userId, $calculatedAt, &$inserted) {
                $grades = $this->truckGrade->gradeMany($chunk);

                $batch = [];

                foreach ($chunk as $truck) {
                    $grade = $grades->get($truck->id);

                    if (! $grade) {
                        continue;
                    }

                    $batch[] = [
                        'snapshot_date' => $snapshotDate,
                        'truck_id' => $truck->id,
                        'vehicle_type_id' => $truck->vehicletype_id,
                        'status' => $truck->status,
                        'filter_vehicle_type_id' => $vehicleTypeId,
                        'filter_status' => $status,
                        'overall_score' => $grade['overall']['score'] ?? 0,
                        'overall_letter' => $grade['overall']['letter'] ?? 'E',
                        'weights' => $grade['weights'] ?? [],
                        'categories' => $grade['categories'] ?? null,
                        'metrics' => $grade['metrics'] ?? null,
                        'grade_thresholds' => $grade['grade_thresholds'] ?? null,
                        'calculated_at' => $calculatedAt,
                        'calculated_by' => $userId,
                        'created_at' => $calculatedAt,
                        'updated_at' => $calculatedAt,
                    ];

                    if (count($batch) >= 200) {
                        TruckGradeSnapshot::query()->insert(
                            array_map(fn (array $payload) => $this->normalizeSnapshotPayload($payload), $batch),
                        );
                        $inserted += count($batch);
                        $batch = [];
                    }
                }

                if ($batch !== []) {
                    TruckGradeSnapshot::query()->insert(
                        array_map(fn (array $payload) => $this->normalizeSnapshotPayload($payload), $batch),
                    );
                    $inserted += count($batch);
                }
            });
        });

        $redirectParams = array_filter([
            'snapshot_date' => $snapshotDate,
            'vehicle_type_id' => $vehicleTypeId,
            'status' => $status,
        ], static fn ($value) => $value !== null && $value !== '');

        $message = $inserted > 0
            ? sprintf('Stored %d truck grade snapshots for %s.', $inserted, Carbon::parse($snapshotDate)->toFormattedDateString())
            : 'No trucks matched the selected filters, so no snapshot was stored.';

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

    private function normalizeSnapshotPayload(array $payload): array
    {
        foreach (['weights', 'categories', 'metrics', 'grade_thresholds'] as $jsonKey) {
            if (! array_key_exists($jsonKey, $payload)) {
                continue;
            }

            $value = $payload[$jsonKey];

            if ($value === null || is_string($value)) {
                continue;
            }

            try {
                $payload[$jsonKey] = json_encode($value, JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                $payload[$jsonKey] = json_encode($value);
            }
        }

        return $payload;
    }
}
