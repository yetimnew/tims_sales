<?php

namespace App\Services\DriverSafety\Data;

use Illuminate\Http\Request;

class DriverSafetyIndexFilters
{
    public function __construct(
        public readonly ?string $search,
        public readonly ?string $incidentType,
        public readonly ?string $severity,
        public readonly ?int $driverId,
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

        $rawIncidentType = strtolower(trim((string) $request->input('incident_type', '')));
        $incidentType = $rawIncidentType !== '' && $rawIncidentType !== 'all' ? $rawIncidentType : null;

        $rawSeverity = strtolower(trim((string) $request->input('severity', '')));
        $severity = $rawSeverity !== '' && $rawSeverity !== 'all' ? $rawSeverity : null;

        $rawDriverId = trim((string) $request->input('driver', ''));
        $driverId = $rawDriverId !== '' && $rawDriverId !== 'all' && is_numeric($rawDriverId)
            ? (int) $rawDriverId
            : null;

        $sortCandidate = (string) $request->input('sort', $defaultSort);
        $sort = in_array($sortCandidate, $allowedSorts, true) ? $sortCandidate : $defaultSort;

        $directionCandidate = strtolower((string) $request->input('direction', $defaultDirection));
        $direction = in_array($directionCandidate, ['asc', 'desc'], true) ? $directionCandidate : $defaultDirection;

        $perPageCandidate = (int) $request->input('per_page', $defaultPerPage);
        $perPage = in_array($perPageCandidate, $perPageOptions, true) ? $perPageCandidate : $defaultPerPage;

        return new self(
            $search,
            $incidentType,
            $severity,
            $driverId,
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
            'incident_type' => $this->incidentType,
            'severity' => $this->severity,
            'driver' => $this->driverId,
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
