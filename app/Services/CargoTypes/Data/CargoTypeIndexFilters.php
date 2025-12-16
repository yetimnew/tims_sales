<?php

namespace App\Services\CargoTypes\Data;

use Illuminate\Http\Request;

class CargoTypeIndexFilters
{
    public function __construct(
        public readonly ?string $search,
        public readonly ?string $category,
        public readonly ?string $requiresSpecialEquipment,
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
        string $defaultDirection = 'asc',
    ): self {
        $search = trim((string) $request->input('search', ''));
        $search = $search !== '' ? $search : null;

        $rawCategory = trim((string) $request->input('category', ''));
        $category = $rawCategory !== '' && $rawCategory !== 'all' ? $rawCategory : null;

        $rawRequiresSpecialEquipment = strtolower(trim((string) $request->input('requires_special_equipment', '')));
        $requiresSpecialEquipment = match (true) {
            $rawRequiresSpecialEquipment === '' => null,
            $rawRequiresSpecialEquipment === 'all' => null,
            in_array($rawRequiresSpecialEquipment, ['1', 'true'], true) => '1',
            in_array($rawRequiresSpecialEquipment, ['0', 'false'], true) => '0',
            default => null,
        };

        $sortCandidate = (string) $request->input('sort', $defaultSort);
        $sort = in_array($sortCandidate, $allowedSorts, true) ? $sortCandidate : $defaultSort;

        $directionCandidate = strtolower((string) $request->input('direction', $defaultDirection));
        $direction = in_array($directionCandidate, ['asc', 'desc'], true) ? $directionCandidate : $defaultDirection;

        $perPageCandidate = (int) $request->input('per_page', $defaultPerPage);
        $perPage = in_array($perPageCandidate, $perPageOptions, true) ? $perPageCandidate : $defaultPerPage;

        return new self(
            $search,
            $category,
            $requiresSpecialEquipment,
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
            'category' => $this->category,
            'requires_special_equipment' => $this->requiresSpecialEquipment,
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
