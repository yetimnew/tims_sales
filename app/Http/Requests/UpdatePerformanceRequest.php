<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePerformanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'load_phase' => 'required|string|in:main,return',
            'load_completion' => 'required|string|in:full,partial',
            'FOnumber' => 'required|string|max:255',
            'operation_id' => 'required|exists:operations,id',
            'driver_truck_id' => 'required|exists:driver_truck,id',
            'DateDispach' => 'required|date_format:Y-m-d\TH:i',
            'orgion_id' => 'required|exists:places,id',
            'destination_id' => 'required|exists:places,id',
            'DistanceWCargo' => 'nullable|numeric|min:0',
            'tonkm' => 'nullable|numeric|min:0',
            'DistanceWOCargo' => 'nullable|numeric|min:0',
            'CargoVolumMT' => 'nullable|numeric|min:0',
            'fuelInLitter' => 'nullable|numeric|min:0',
            'fuelInBirr' => 'nullable|numeric|min:0',
            'perdiem' => 'nullable|numeric|min:0',
            'workOnGoing' => 'nullable|numeric|min:0',
            'other' => 'nullable|numeric|min:0',
            'comment' => 'nullable|string|max:1000',
            'satus' => 'required|string|in:active,inactive,completed,cancelled',
            'is_returned' => 'boolean',
            'returned_date' => 'nullable|date_format:Y-m-d\TH:i',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'FOnumber' => trim($this->FOnumber ?? ''),
            'comment' => trim($this->comment ?? ''),
        ]);
    }
}
