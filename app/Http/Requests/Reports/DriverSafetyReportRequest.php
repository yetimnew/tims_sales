<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DriverSafetyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can('reports.driver-safety.view') || $user->can('reports.driver-safety.export');
    }

    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'driver_ids' => ['nullable', 'array'],
            'driver_ids.*' => ['integer', Rule::exists('drivers', 'id')],
            'driver_id' => ['nullable', 'integer', Rule::exists('drivers', 'id')],
            'incident_types' => ['nullable', 'array'],
            'incident_types.*' => ['string', 'max:255'],
            'incident_type' => ['nullable', 'string', 'max:255'],
            'severities' => ['nullable', 'array'],
            'severities.*' => ['string', 'max:255'],
            'severity' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50, 100])],
            'format' => ['nullable', Rule::in(['csv', 'xlsx', 'pdf'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $driverIds = $this->input('driver_ids');
        $singleDriver = $this->input('driver_id');
        $incidentTypes = $this->input('incident_types');
        $singleIncidentType = $this->input('incident_type');
        $severities = $this->input('severities');
        $singleSeverity = $this->input('severity');

        if ($driverIds === null && $singleDriver !== null) {
            $driverIds = [$singleDriver];
        }

        if (is_string($driverIds)) {
            $driverIds = array_filter(array_map('trim', explode(',', $driverIds)));
        }

        if (is_array($driverIds)) {
            $driverIds = array_values(array_unique(array_filter($driverIds, static fn ($value) => $value !== null && $value !== '')));
        }

        if ($incidentTypes === null && $singleIncidentType !== null) {
            $incidentTypes = [$singleIncidentType];
        }

        if (is_string($incidentTypes)) {
            $incidentTypes = array_filter(array_map('trim', explode(',', $incidentTypes)));
        }

        if (is_array($incidentTypes)) {
            $incidentTypes = array_values(array_unique(array_filter($incidentTypes, static fn ($value) => $value !== null && $value !== '')));
        }

        if ($severities === null && $singleSeverity !== null) {
            $severities = [$singleSeverity];
        }

        if (is_string($severities)) {
            $severities = array_filter(array_map('trim', explode(',', $severities)));
        }

        if (is_array($severities)) {
            $severities = array_values(array_unique(array_filter($severities, static fn ($value) => $value !== null && $value !== '')));
        }

        $this->merge([
            'driver_ids' => $driverIds,
            'incident_types' => $incidentTypes,
            'severities' => $severities,
        ]);
    }
}
