<?php

namespace App\Services\Reports;

use App\Models\DriverTruck;
use App\Models\DriverTruckGradeSnapshot;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

class DriverTruckGradingReport
{
    public const PER_PAGE_OPTIONS = [10, 25, 50];

    public function build(array $input): array
    {
        $perPage = (int) ($input['per_page'] ?? self::PER_PAGE_OPTIONS[0]);

        if (! in_array($perPage, self::PER_PAGE_OPTIONS, true)) {
            $perPage = self::PER_PAGE_OPTIONS[0];
        }

        $gradeLetter = strtoupper((string) ($input['grade_letter'] ?? '')) ?: null;
        $attachmentState = $this->normalizeAttachmentState($input['attachment_state'] ?? null);

        $availableDates = $this->availableSnapshotDates();
        $snapshotDate = $this->resolveSnapshotDate($input['snapshot_date'] ?? null, $availableDates);
        $status = $this->normalizeString($input['status'] ?? null);

        $paginator = $this->paginate(
            $snapshotDate,
            $status,
            $attachmentState,
            $gradeLetter,
            $perPage,
        );

        $latestCalculation = $this->latestCalculation($snapshotDate, $status, $attachmentState);

        return [
            'filters' => [
                'snapshot_date' => $snapshotDate,
                'status' => $status,
                'attachment_state' => $attachmentState,
                'grade_letter' => $gradeLetter,
                'per_page' => $perPage,
            ],
            'filter_options' => [
                'dates' => $availableDates,
                'statuses' => $this->statusOptions(),
                'attachment_states' => $this->attachmentStateOptions(),
            ],
            'paginator' => $this->formatPaginator($paginator),
            'latest_calculation' => $latestCalculation,
            'per_page_options' => self::PER_PAGE_OPTIONS,
        ];
    }

    public function latestCalculation(?string $snapshotDate = null, ?string $status = null, ?string $attachmentState = null): ?array
    {
        $query = DriverTruckGradeSnapshot::query()
            ->with('calculatedBy:id,name')
            ->orderByDesc('calculated_at');

        if ($snapshotDate) {
            $query->whereDate('snapshot_date', $snapshotDate);
        }

        if ($status !== null) {
            $query->where('filter_status', $status);
        } else {
            $query->whereNull('filter_status');
        }

        $isAttached = $this->attachmentStateToBool($attachmentState);

        if ($isAttached !== null) {
            $query->where('filter_is_attached', $isAttached);
        } else {
            $query->whereNull('filter_is_attached');
        }

        $snapshot = $query->first();

        if (! $snapshot) {
            return null;
        }

        return [
            'calculated_at' => $snapshot->calculated_at?->toIso8601String(),
            'calculated_by' => $snapshot->calculatedBy?->only(['id', 'name']),
            'count' => DriverTruckGradeSnapshot::query()
                ->whereDate('snapshot_date', $snapshot->snapshot_date)
                ->when($snapshot->filter_status !== null, static fn ($q) => $q->where('filter_status', $snapshot->filter_status))
                ->when($snapshot->filter_status === null, static fn ($q) => $q->whereNull('filter_status'))
                ->when($snapshot->filter_is_attached !== null, static fn ($q) => $q->where('filter_is_attached', $snapshot->filter_is_attached))
                ->when($snapshot->filter_is_attached === null, static fn ($q) => $q->whereNull('filter_is_attached'))
                ->count(),
        ];
    }

    private function paginate(
        ?string $snapshotDate,
        ?string $status,
        ?string $attachmentState,
        ?string $gradeLetter,
        int $perPage,
    ): LengthAwarePaginator {
        if (! $snapshotDate) {
            return $this->emptyPaginator($perPage);
        }

        $query = DriverTruckGradeSnapshot::query()
            ->with([
                'assignment.driver:id,name',
                'assignment.truck:id,plate',
                'calculatedBy:id,name',
            ]);

        $this->applySnapshotFilters($query, $snapshotDate, $status, $attachmentState);

        if ($gradeLetter) {
            $query->where('overall_letter', $gradeLetter);
        }

        $paginator = $query
            ->orderByDesc('overall_score')
            ->paginate($perPage)
            ->withQueryString();

        $paginator->setCollection(
            $paginator->getCollection()->map(function (DriverTruckGradeSnapshot $snapshot) {
                $assignment = $snapshot->assignment;
                $driver = $assignment?->driver;
                $truck = $assignment?->truck;

                return [
                    'id' => $snapshot->driver_truck_id,
                    'driver' => $driver ? $driver->only(['id', 'name']) : ($snapshot->driver_id ? ['id' => $snapshot->driver_id] : null),
                    'truck' => $truck ? $truck->only(['id', 'plate']) : ($snapshot->truck_id ? ['id' => $snapshot->truck_id] : null),
                    'status' => $snapshot->status,
                    'is_attached' => (bool) $snapshot->is_attached,
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
            })
        );

        return $paginator;
    }

    private function applySnapshotFilters($query, string $snapshotDate, ?string $status, ?string $attachmentState): void
    {
        $query->whereDate('snapshot_date', $snapshotDate);

        if ($status !== null) {
            $query->where('filter_status', $status);
        } else {
            $query->whereNull('filter_status');
        }

        $isAttached = $this->attachmentStateToBool($attachmentState);

        if ($isAttached !== null) {
            $query->where('filter_is_attached', $isAttached);
        } else {
            $query->whereNull('filter_is_attached');
        }
    }

    private function availableSnapshotDates(): array
    {
        return DriverTruckGradeSnapshot::query()
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
        return DriverTruck::query()
            ->select('status')
            ->whereNotNull('status')
            ->distinct()
            ->orderBy('status')
            ->pluck('status')
            ->filter(static fn (?string $value) => $value !== null && $value !== '')
            ->values()
            ->all();
    }

    private function attachmentStateOptions(): array
    {
        return ['attached', 'detached'];
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

    private function normalizeAttachmentState($value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = strtolower(trim((string) $value));

        return in_array($normalized, ['attached', 'detached'], true) ? $normalized : null;
    }

    private function attachmentStateToBool(?string $value): ?bool
    {
        return match ($this->normalizeAttachmentState($value)) {
            'attached' => true,
            'detached' => false,
            default => null,
        };
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
