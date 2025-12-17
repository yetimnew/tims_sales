<?php

namespace App\Services\StatusTypes\Data;

final class StatusTypeIndexResult
{
    /**
     * @param  array{data: array<int, array<string, mixed>>, meta: array<string, mixed>, links: array<int, array<string, mixed>>}  $statusTypes
     * @param  array<string, mixed>|null  $metrics
     * @param  array<string, string|int|null>  $filters
     * @param  array<int, array{label: string, value: string}>  $usageOptions
     * @param  array<int, int>  $perPageOptions
     */
    public function __construct(
        public readonly array $statusTypes,
        public readonly ?array $metrics,
        public readonly array $filters,
        public readonly array $usageOptions,
        public readonly array $perPageOptions,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toInertia(): array
    {
        return [
            'statusTypes' => $this->statusTypes,
            'metrics' => $this->metrics,
            'filters' => $this->filters,
            'usageOptions' => $this->usageOptions,
            'perPageOptions' => $this->perPageOptions,
        ];
    }
}
