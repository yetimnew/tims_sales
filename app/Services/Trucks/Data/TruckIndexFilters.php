<?php

namespace App\Services\Trucks\Data;

use Illuminate\Http\Request;

class TruckIndexFilters
{
    public function __construct(
        public readonly ?string $search,
        public readonly ?string $status,
        public readonly ?int $vehicleTypeId,
        public readonly string $sort,
        public readonly string $direction,
        public readonly int $perPage
    ) {}

    /**
     * Build sanitized filters from the incoming request.
     *
     * @param  array<int, int>  $perPageOptions
     * @param  array<int, string>  $allowedSorts
     */
    public static function fromRequest(Request $request, array $perPageOptions, int $defaultPerPage, array $allowedSorts, string $defaultSort, string $defaultDirection = 'desc'): self
    {
        $search = trim((string) $request->input('search', ''));
        $search = $search !== '' ? $search : null;

        $statusInput = $request->has('status') ? (string) $request->input('status') : 'active';
        $rawStatus = trim($statusInput);
        $status = $rawStatus !== '' ? $rawStatus : 'active';

        $vehicleTypeInput = $request->input('vehicle_type');
        $vehicleTypeId = ($vehicleTypeInput !== null && $vehicleTypeInput !== '') ? (int) $vehicleTypeInput : null;

        $sortCandidate = (string) $request->input('sort', $defaultSort);
        $sort = in_array($sortCandidate, $allowedSorts, true) ? $sortCandidate : $defaultSort;

        $directionCandidate = strtolower((string) $request->input('direction', $defaultDirection));
        $direction = in_array($directionCandidate, ['asc', 'desc'], true) ? $directionCandidate : $defaultDirection;

        $perPageCandidate = (int) $request->input('per_page', $defaultPerPage);
        $perPage = in_array($perPageCandidate, $perPageOptions, true) ? $perPageCandidate : $defaultPerPage;

        return new self(
            $search,
            $status,
            $vehicleTypeId,
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
            'vehicle_type' => $this->vehicleTypeId,
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
