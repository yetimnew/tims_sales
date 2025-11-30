<?php

namespace App\Services\Reports;

use App\Models\Truck;
use App\Models\TruckGradeSnapshot;
use App\Models\VehicleType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

class TruckGradingReport
{
    public const PER_PAGE_OPTIONS = [10, 25, 50];

    public function build(array $input): array
    {
        $perPage = (int) ($input['per_page'] ?? self::PER_PAGE_OPTIONS[0]);

        if (! in_array($perPage, self::PER_PAGE_OPTIONS, true)) {
            $perPage = self::PER_PAGE_OPTIONS[0];
        }

        $gradeLetter = strtoupper((string) ($input['grade_letter'] ?? '')) ?: null;

        $availableDates = $this->availableSnapshotDates();

        $snapshotDate = $this->resolveSnapshotDate($input['snapshot_date'] ?? null, $availableDates);
        $vehicleTypeId = $this->normalizeInteger($input['vehicle_type_id'] ?? null);
        $status = $this->normalizeString($input['status'] ?? null);

        $paginator = $this->paginate(
            $snapshotDate,
            $vehicleTypeId,
            $status,
            $gradeLetter,
            $perPage,
        );

        $latestCalculation = $this->latestCalculation($snapshotDate, $vehicleTypeId, $status);

        return [
            'filters' => [
                'snapshot_date' => $snapshotDate,
                'vehicle_type_id' => $vehicleTypeId,
                'status' => $status,
                'grade_letter' => $gradeLetter,
                'per_page' => $perPage,
            ],
            'filter_options' => [
                'dates' => $availableDates,
                'vehicle_types' => $this->vehicleTypeOptions(),
                'statuses' => $this->statusOptions(),
            ],
            'paginator' => $this->formatPaginator($paginator),
            'latest_calculation' => $latestCalculation,
            'per_page_options' => self::PER_PAGE_OPTIONS,
        ];
    }

    public function filterOptions(): array
    {
        return [
            'dates' => $this->availableSnapshotDates(),
            'vehicle_types' => $this->vehicleTypeOptions(),
            'statuses' => $this->statusOptions(),
        ];
    }

    public function latestCalculation(?string $snapshotDate = null, ?int $vehicleTypeId = null, ?string $status = null): ?array
    {
        $query = TruckGradeSnapshot::query()
            ->with('calculatedBy:id,name')
            ->orderByDesc('calculated_at');

        if ($snapshotDate) {
            $query->whereDate('snapshot_date', $snapshotDate);
        }

        if ($vehicleTypeId !== null) {
            $query->where('filter_vehicle_type_id', $vehicleTypeId);
        }

        if ($status !== null) {
            $query->where('filter_status', $status);
        }

        $snapshot = $query->first();

        if (! $snapshot) {
            return null;
        }

        return [
            'calculated_at' => $snapshot->calculated_at?->toIso8601String(),
            'calculated_by' => $snapshot->calculatedBy?->only(['id', 'name']),
            'count' => TruckGradeSnapshot::query()
                ->whereDate('snapshot_date', $snapshot->snapshot_date)
                ->when($snapshot->filter_vehicle_type_id, static fn ($query, $id) => $query->where('filter_vehicle_type_id', $id))
                ->when($snapshot->filter_status, static fn ($query, $value) => $query->where('filter_status', $value))
                ->count(),
        ];
    }

    private function availableSnapshotDates(): array
    {
        return TruckGradeSnapshot::query()
            ->select('snapshot_date')
            ->distinct()
            ->orderByDesc('snapshot_date')
            ->limit(60)
            ->pluck('snapshot_date')
            ->map(static fn ($date) => Carbon::parse($date)->toDateString())
            ->all();
    }

    private function vehicleTypeOptions(): array
    {
        return VehicleType::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (VehicleType $type) => [
                'id' => $type->id,
                'name' => $type->name,
            ])
            ->all();
    }

    private function statusOptions(): array
    {
        return Truck::query()
            ->select('status')
            ->whereNotNull('status')
            ->distinct()
            ->orderBy('status')
            ->pluck('status')
            ->filter(static fn (?string $value) => $value !== null && $value !== '')
            ->values()
            ->all();
    }

    private function paginate(
        ?string $snapshotDate,
        ?int $vehicleTypeId,
        ?string $status,
        ?string $gradeLetter,
        int $perPage,
    ): LengthAwarePaginator {
        if (! $snapshotDate) {
            return $this->emptyPaginator($perPage);
        }

        $query = TruckGradeSnapshot::query()
            ->with([
                'truck:id,plate,vehicletype_id,status,serviceStartDate,productionDate,purchasePrice',
                'truck.vehicleType:id,name',
                'vehicleType:id,name',
                'calculatedBy:id,name',
            ]);

        $this->applySnapshotFilters($query, $snapshotDate, $vehicleTypeId, $status);

        if ($gradeLetter) {
            $query->where('overall_letter', $gradeLetter);
        }

        $paginator = $query
            ->orderByDesc('overall_score')
            ->paginate($perPage)
            ->withQueryString();

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

        return $paginator;
    }

    private function applySnapshotFilters($query, string $snapshotDate, ?int $vehicleTypeId, ?string $status): void
    {
        $query->whereDate('snapshot_date', $snapshotDate);

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
    }

    private function emptyPaginator(int $perPage): LengthAwarePaginator
    {
        return new Paginator(
            collect(),
            0,
            $perPage,
            1,
            [
                'path' => URL::current(),
            ],
        );
    }

    private function resolveSnapshotDate(?string $candidate, array $availableDates): ?string
    {
        if ($candidate) {
            try {
                $normalized = Carbon::parse($candidate)->toDateString();

                if (in_array($normalized, $availableDates, true)) {
                    return $normalized;
                }
            } catch (\Throwable) {
                // Ignore parsing issues and fall back to defaults.
            }
        }

        return $availableDates[0] ?? null;
    }

    private function normalizeInteger($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $int = (int) $value;

        return $int > 0 ? $int : null;
    }

    private function normalizeString($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim((string) $value);

        return $trimmed !== '' ? $trimmed : null;
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
