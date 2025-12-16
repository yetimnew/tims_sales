<?php

namespace App\Services\Drivers\Data;

use Illuminate\Http\Request;

class DriverIndexFilters
{
    public function __construct(
        public readonly ?string $search,
        public readonly ?string $status,
        public readonly ?string $sex,
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
        string $defaultDirection = 'asc'
    ): self {
        $search = trim((string) $request->input('search', ''));
        $search = $search !== '' ? $search : null;

        $rawStatus = trim((string) $request->input('status', ''));
        $status = $rawStatus !== '' ? strtolower($rawStatus) : null;

        $rawSex = trim((string) $request->input('sex', ''));
        $sex = $rawSex !== '' ? strtolower($rawSex) : null;

        $sortCandidate = (string) $request->input('sort', $defaultSort);
        $sort = in_array($sortCandidate, $allowedSorts, true) ? $sortCandidate : $defaultSort;

        $directionCandidate = strtolower((string) $request->input('direction', $defaultDirection));
        $direction = in_array($directionCandidate, ['asc', 'desc'], true) ? $directionCandidate : $defaultDirection;

        $perPageCandidate = (int) $request->input('per_page', $defaultPerPage);
        $perPage = in_array($perPageCandidate, $perPageOptions, true) ? $perPageCandidate : $defaultPerPage;

        return new self(
            $search,
            $status === 'all' ? null : $status,
            $sex === 'all' ? null : $sex,
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
            'sex' => $this->sex,
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
