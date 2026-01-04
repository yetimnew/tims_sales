<?php

namespace App\Services\DriverTrucks\Data;

use Illuminate\Http\Request;

class DriverTruckIndexFilters
{
    public function __construct(
        public readonly ?string $search,
        public readonly ?string $status,
        public readonly ?int $truckId,
        public readonly string $sort,
        public readonly string $direction,
        public readonly int $perPage,
    ) {}

    /**
     * @param  array<int, int>  $perPageOptions
     * @param  array<int, string>  $allowedSorts
     */
    public static function fromRequest(
        Request $request,
        array $perPageOptions,
        int $defaultPerPage,
        array $allowedSorts,
        string $defaultSort,
        string $defaultDirection = 'desc',
    ): self {
        $search = trim((string) $request->input('search', ''));
        $search = $search !== '' ? $search : null;

        $rawStatus = strtolower(trim((string) $request->input('status', '')));
        $status = $rawStatus !== '' && $rawStatus !== 'all' ? $rawStatus : null;

        $truckIdRaw = $request->input('truck_id', $request->input('truck'));
        $truckId = null;

        if ($truckIdRaw !== null && $truckIdRaw !== '') {
            $truckIdCandidate = filter_var($truckIdRaw, FILTER_VALIDATE_INT);

            if ($truckIdCandidate !== false && $truckIdCandidate > 0) {
                $truckId = $truckIdCandidate;
            }
        }

        $sortCandidate = (string) $request->input('sort', $defaultSort);
        $sort = in_array($sortCandidate, $allowedSorts, true) ? $sortCandidate : $defaultSort;

        $directionCandidate = strtolower((string) $request->input('direction', $defaultDirection));
        $direction = in_array($directionCandidate, ['asc', 'desc'], true) ? $directionCandidate : $defaultDirection;

        $perPageCandidate = (int) $request->input('per_page', $defaultPerPage);
        $perPage = in_array($perPageCandidate, $perPageOptions, true) ? $perPageCandidate : $defaultPerPage;

        return new self(
            $search,
            $status,
            $truckId,
            $sort,
            $direction,
            $perPage,
        );
    }

    /**
     * @return array<string, string|int|null>
     */
    public function toFilterArray(): array
    {
        return [
            'search' => $this->search,
            'status' => $this->status,
            'truck_id' => $this->truckId,
            'sort' => $this->sort,
            'direction' => $this->direction,
            'per_page' => $this->perPage,
        ];
    }

    /**
     * @return array<string, string|int>
     */
    public function toQueryParameters(): array
    {
        return collect($this->toFilterArray())
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->map(fn ($value) => is_string($value) ? $value : (int) $value)
            ->all();
    }
}
