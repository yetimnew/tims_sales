<?php

namespace App\Services\FuelRecords\Data;

use Illuminate\Http\Request;

class FuelRecordIndexFilters
{
    public function __construct(
        public readonly ?string $search,
        public readonly ?string $fuelType,
        public readonly ?int $truckId,
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

        $fuelTypeRaw = strtolower(trim((string) $request->input('fuel_type', '')));
        $fuelType = $fuelTypeRaw !== '' && $fuelTypeRaw !== 'all' ? $fuelTypeRaw : null;

        $truckId = self::normalizeId($request->input('truck'));
        $driverId = self::normalizeId($request->input('driver'));

        $sortCandidate = (string) $request->input('sort', $defaultSort);
        $sort = in_array($sortCandidate, $allowedSorts, true) ? $sortCandidate : $defaultSort;

        $directionCandidate = strtolower((string) $request->input('direction', $defaultDirection));
        $direction = in_array($directionCandidate, ['asc', 'desc'], true) ? $directionCandidate : $defaultDirection;

        $perPageCandidate = (int) $request->input('per_page', $defaultPerPage);
        $perPage = in_array($perPageCandidate, $perPageOptions, true) ? $perPageCandidate : $defaultPerPage;

        return new self(
            $search,
            $fuelType,
            $truckId,
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
            'fuel_type' => $this->fuelType,
            'truck' => $this->truckId,
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

    private static function normalizeId(mixed $value): ?int
    {
        if ($value === null || $value === '' || $value === 'all') {
            return null;
        }

        if (is_numeric($value)) {
            $intValue = (int) $value;

            return $intValue > 0 ? $intValue : null;
        }

        return null;
    }
}
