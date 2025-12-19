<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MaintenancePerformanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can('reports.maintenance.view') || $user->can('reports.maintenance.export');
    }

    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'truck_ids' => ['nullable', 'array'],
            'truck_ids.*' => ['integer', Rule::exists('trucks', 'id')],
            'truck_id' => ['nullable', 'integer', Rule::exists('trucks', 'id')],
            'maintenance_type_ids' => ['nullable', 'array'],
            'maintenance_type_ids.*' => ['integer', Rule::exists('maintenance_types', 'id')],
            'maintenance_type_id' => ['nullable', 'integer', Rule::exists('maintenance_types', 'id')],
            'statuses' => ['nullable', 'array'],
            'statuses.*' => ['string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'service_providers' => ['nullable', 'array'],
            'service_providers.*' => ['string', 'max:255'],
            'service_provider' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50, 100])],
            'format' => ['nullable', Rule::in(['csv', 'xlsx', 'pdf'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $truckIds = $this->input('truck_ids');
        $singleTruck = $this->input('truck_id');
        $maintenanceTypeIds = $this->input('maintenance_type_ids');
        $singleMaintenanceType = $this->input('maintenance_type_id');
        $statuses = $this->input('statuses');
        $singleStatus = $this->input('status');
        $providers = $this->input('service_providers');
        $singleProvider = $this->input('service_provider');

        if ($truckIds === null && $singleTruck !== null) {
            $truckIds = [$singleTruck];
        }

        if (is_string($truckIds)) {
            $truckIds = array_filter(array_map('trim', explode(',', $truckIds)));
        }

        if (is_array($truckIds)) {
            $truckIds = array_values(array_unique(array_filter($truckIds, static fn ($value) => $value !== null && $value !== '')));
        }

        if ($maintenanceTypeIds === null && $singleMaintenanceType !== null) {
            $maintenanceTypeIds = [$singleMaintenanceType];
        }

        if (is_string($maintenanceTypeIds)) {
            $maintenanceTypeIds = array_filter(array_map('trim', explode(',', $maintenanceTypeIds)));
        }

        if (is_array($maintenanceTypeIds)) {
            $maintenanceTypeIds = array_values(array_unique(array_filter($maintenanceTypeIds, static fn ($value) => $value !== null && $value !== '')));
        }

        if ($statuses === null && $singleStatus !== null) {
            $statuses = [$singleStatus];
        }

        if (is_string($statuses)) {
            $statuses = array_filter(array_map('trim', explode(',', $statuses)));
        }

        if (is_array($statuses)) {
            $statuses = array_values(array_unique(array_filter($statuses, static fn ($value) => $value !== null && $value !== '')));
        }

        if ($providers === null && $singleProvider !== null) {
            $providers = [$singleProvider];
        }

        if (is_string($providers)) {
            $providers = array_filter(array_map('trim', explode(',', $providers)));
        }

        if (is_array($providers)) {
            $providers = array_values(array_unique(array_filter($providers, static fn ($value) => $value !== null && $value !== '')));
        }

        $this->merge([
            'truck_ids' => $truckIds,
            'maintenance_type_ids' => $maintenanceTypeIds,
            'statuses' => $statuses,
            'service_providers' => $providers,
        ]);
    }
}
