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
            'description' => ['nullable', 'string', 'max:1000'],
            'assigned_mechanic_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
