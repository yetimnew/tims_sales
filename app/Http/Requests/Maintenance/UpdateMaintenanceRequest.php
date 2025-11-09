<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaintenanceRequest extends FormRequest
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
            'scheduled_date' => ['required', 'date'],
            'completed_date' => ['nullable', 'date'],
            'odometer_reading' => ['nullable', 'integer', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:1000'],
            'work_performed' => ['nullable', 'string', 'max:2000'],
            'parts_replaced' => ['nullable', 'string', 'max:2000'],
            'service_provider' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:scheduled,in_progress,completed,overdue'],
            'assigned_mechanic_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
