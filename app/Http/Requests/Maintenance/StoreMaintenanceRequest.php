<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaintenanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'truck_id' => ['required', 'exists:trucks,id'],
            'maintenance_type_id' => ['required', 'exists:maintenance_types,id'],
            'scheduled_date' => ['required', 'date', 'after_or_equal:today'],
            'completed_date' => ['nullable', 'date', 'after_or_equal:scheduled_date'],
            'odometer_reading' => ['nullable', 'integer', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:1000'],
            'work_performed' => ['nullable', 'string', 'max:2000'],
            'parts_replaced' => ['nullable', 'string', 'max:2000'],
            'service_provider' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:scheduled,in_progress,completed,overdue'],
            'assigned_mechanic_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $assignedMechanic = $this->input('assigned_mechanic_id');
        $normalizedMechanic = null;

        if ($assignedMechanic !== null && $assignedMechanic !== '') {
            $mechanicId = (int) $assignedMechanic;
            if ($mechanicId > 0) {
                $normalizedMechanic = $mechanicId;
            }
        }

        $this->merge([
            'assigned_mechanic_id' => $normalizedMechanic,
            'odometer_reading' => $this->input('odometer_reading') !== null && $this->input('odometer_reading') !== ''
                ? (int) $this->input('odometer_reading')
                : null,
            'cost' => $this->input('cost') !== null && $this->input('cost') !== ''
                ? (float) $this->input('cost')
                : null,
            'completed_date' => $this->input('completed_date') !== '' ? $this->input('completed_date') : null,
            'work_performed' => $this->input('work_performed') !== '' ? $this->input('work_performed') : null,
            'parts_replaced' => $this->input('parts_replaced') !== '' ? $this->input('parts_replaced') : null,
            'service_provider' => $this->input('service_provider') !== '' ? $this->input('service_provider') : null,
        ]);
    }
}
