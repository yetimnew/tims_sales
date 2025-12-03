<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FuelEfficiencyRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can('reports.fuel-efficiency.view') || $user->can('reports.fuel-efficiency.export');
    }

    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'truck_ids' => ['nullable', 'array'],
            'truck_ids.*' => ['integer', Rule::exists('trucks', 'id')],
            'truck_id' => ['nullable', 'integer', Rule::exists('trucks', 'id')],
            'format' => ['nullable', Rule::in(['csv', 'xlsx', 'pdf'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $truckIds = $this->input('truck_ids');
        $singleTruck = $this->input('truck_id');

        if ($truckIds === null && $singleTruck !== null) {
            $truckIds = [$singleTruck];
        }

        if (is_string($truckIds)) {
            $truckIds = array_filter(array_map('trim', explode(',', $truckIds)));
        }

        if (is_array($truckIds)) {
            $truckIds = array_values(array_unique(array_filter($truckIds, static fn ($value) => $value !== null && $value !== '')));
        }

        $this->merge([
            'truck_ids' => $truckIds,
        ]);
    }
}
