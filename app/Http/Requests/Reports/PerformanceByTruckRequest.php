<?php

namespace App\Http\Requests\Reports;

use App\Models\Truck;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class PerformanceByTruckRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can('reports.performance-by-truck.view') || $user->can('reports.performance-by-truck.export');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $availableStatuses = $this->availableStatuses();

        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'truck_ids' => ['nullable', 'array'],
            'truck_ids.*' => ['integer', Rule::exists('trucks', 'id')],
            'truck_id' => ['nullable', 'integer', Rule::exists('trucks', 'id')],
            'vehicle_type_ids' => ['nullable', 'array'],
            'vehicle_type_ids.*' => ['integer', Rule::exists('vehicletypes', 'id')],
            'statuses' => ['nullable', 'array'],
            'statuses.*' => array_filter([
                'string',
                ! empty($availableStatuses) ? Rule::in($availableStatuses) : null,
            ]),
            'format' => ['nullable', Rule::in(['csv', 'xlsx', 'pdf'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $truckIds = $this->input('truck_ids');
        $singleTruck = $this->input('truck_id');
        $vehicleTypeIds = $this->input('vehicle_type_ids');
        $statuses = $this->input('statuses');

        if ($truckIds === null && $singleTruck !== null) {
            $truckIds = [$singleTruck];
        }

        $truckIds = $this->sanitiseIdCollection($truckIds);
        $vehicleTypeIds = $this->sanitiseIdCollection($vehicleTypeIds);
        $statuses = $this->sanitiseStringCollection($statuses);

        $this->merge([
            'truck_ids' => $truckIds,
            'vehicle_type_ids' => $vehicleTypeIds,
            'statuses' => $statuses,
        ]);
    }

    /**
     * @param  array<int, mixed>|string|null  $value
     * @return array<int, int>|null
     */
    private function sanitiseIdCollection(array|string|null $value): ?array
    {
        if ($value === null) {
            return null;
        }

        $ids = is_string($value)
            ? array_map('trim', explode(',', $value))
            : Arr::wrap($value);

        $ids = array_filter($ids, static fn ($item) => $item !== null && $item !== '');

        if (empty($ids)) {
            return [];
        }

        return collect($ids)
            ->map(static fn ($item) => (int) $item)
            ->filter(static fn ($item) => $item > 0)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, mixed>|string|null  $value
     * @return array<int, string>|null
     */
    private function sanitiseStringCollection(array|string|null $value): ?array
    {
        if ($value === null) {
            return null;
        }

        $items = is_string($value)
            ? array_map('trim', explode(',', $value))
            : Arr::wrap($value);

        $items = array_filter($items, static fn ($item) => $item !== null && $item !== '');

        if (empty($items)) {
            return [];
        }

        return collect($items)
            ->map(static fn ($item) => trim((string) $item))
            ->filter(static fn ($item) => $item !== '')
            ->unique()
            ->values()
            ->all();
    }

    private function availableStatuses(): array
    {
        return Truck::query()
            ->select('status')
            ->whereNotNull('status')
            ->distinct()
            ->pluck('status')
            ->filter(static fn ($status) => $status !== null && $status !== '')
            ->values()
            ->all();
    }
}
