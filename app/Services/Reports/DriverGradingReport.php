<?php

namespace App\Services\Reports;

use App\Models\Driver;
use App\Models\DriverGradeSnapshot;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

class DriverGradingReport
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
        $status = $this->normalizeString($input['status'] ?? null);

        $paginator = $this->paginate(
            $snapshotDate,
            $status,
            $gradeLetter,
            $perPage,
        );

        $latestCalculation = $this->latestCalculation($snapshotDate, $status);

        return [
            'filters' => [
                'snapshot_date' => $snapshotDate,
                'status' => $status,
                'grade_letter' => $gradeLetter,
                'per_page' => $perPage,
            ],
            'filter_options' => [
                'dates' => $availableDates,
                'statuses' => $this->statusOptions(),
            ],
            'paginator' => $this->formatPaginator($paginator),
            'latest_calculation' => $latestCalculation,
            'per_page_options' => self::PER_PAGE_OPTIONS,
        ];
    }

    public function latestCalculation(?string $snapshotDate = null, ?string $status = null): ?array
    {
        $query = DriverGradeSnapshot::query()
            ->with('calculatedBy:id,name')
            ->orderByDesc('calculated_at');

        if ($snapshotDate) {
            $query->whereDate('snapshot_date', $snapshotDate);
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
            'count' => DriverGradeSnapshot::query()
                ->whereDate('snapshot_date', $snapshot->snapshot_date)
                ->when($snapshot->filter_status, static fn ($q, $value) => $q->where('filter_status', $value))
                ->count(),
        ];
    }

    private function availableSnapshotDates(): array
    {
        return DriverGradeSnapshot::query()
            ->select('snapshot_date')
            ->distinct()
            ->orderByDesc('snapshot_date')
            ->limit(60)
            ->pluck('snapshot_date')
            ->map(static fn ($date) => Carbon::parse($date)->toDateString())
            ->all();
    }

    private function statusOptions(): array
    {
        return Driver::query()
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
        ?string $status,
        ?string $gradeLetter,
        int $perPage,
    ): LengthAwarePaginator {
        if (! $snapshotDate) {
            return $this->emptyPaginator($perPage);
        }

        $query = DriverGradeSnapshot::query()
            ->with(['driver:id,name,status', 'calculatedBy:id,name']);

        $this->applySnapshotFilters($query, $snapshotDate, $status);

        if ($gradeLetter) {
            $query->where('overall_letter', $gradeLetter);
        }

        $paginator = $query
            ->orderByDesc('overall_score')
            ->paginate($perPage)
            ->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(function (DriverGradeSnapshot $snapshot) {
                $driver = $snapshot->driver;

                return [
                    'id' => $driver?->id ?? $snapshot->driver_id,
                    'name' => $driver?->name ?? '—',
                    'status' => $snapshot->status ?? $driver?->status,
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

    private function applySnapshotFilters($query, string $snapshotDate, ?string $status): void
    {
        $query->whereDate('snapshot_date', $snapshotDate);

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
                // ignore
            }
        }

        return $availableDates[0] ?? null;
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
