<?php

declare(strict_types=1);

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class DailyStatusReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can($this->isExportRoute() ? 'reports.daily-status.export' : 'reports.daily-status.view');
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'truck_ids' => ['nullable', 'array'],
            'truck_ids.*' => ['integer', Rule::exists('trucks', 'id')],
            'status_ids' => ['nullable', 'array'],
            'status_ids.*' => ['integer', Rule::exists('statuses', 'id')],
            'per_page' => ['nullable', 'integer', 'min:3', 'max:62'],
            'page' => ['nullable', 'integer', 'min:1'],
            'format' => ['nullable', Rule::in(['csv', 'xlsx', 'pdf'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $truckIds = $this->normaliseIds($this->input('truck_ids'));
        $statusIds = $this->normaliseIds($this->input('status_ids'));
        $perPage = $this->normaliseInteger($this->input('per_page'));
        $page = $this->normaliseInteger($this->input('page'));

        $this->merge([
            'truck_ids' => $truckIds,
            'status_ids' => $statusIds,
            'per_page' => $perPage,
            'page' => $page,
        ]);
    }

    private function isExportRoute(): bool
    {
        $route = $this->route();
        $name = $route?->getName();

        return $name !== null && str_ends_with($name, '.export');
    }

    /**
     * @param  array<int, mixed>|string|null  $value
     * @return array<int, int>|null
     */
    private function normaliseIds(array|string|null $value): ?array
    {
        if ($value === null) {
            return null;
        }

        $items = is_string($value)
            ? array_map('trim', explode(',', $value))
            : Arr::wrap($value);

        $items = array_filter($items, static fn ($item) => $item !== null && $item !== '');

        if ($items === []) {
            return [];
        }

        return collect($items)
            ->map(static fn ($item) => (int) $item)
            ->filter(static fn (int $item) => $item > 0)
            ->unique()
            ->values()
            ->all();
    }

    private function normaliseInteger(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }
}
