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
            'trip' => 'required|string|max:255',
            'LoadType' => 'required|string|in:Full Load,Half Load,Empty',
            'FOnumber' => 'required|string|max:255',
            'operation_id' => 'required|exists:operations,id',
            'driver_truck_id' => 'required|exists:driver_truck,id',
            'DateDispach' => 'required|date',
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
            'satus' => 'required|string|in:completed,ongoing,cancelled',
            'is_returned' => 'boolean',
            'returned_date' => 'nullable|date',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'trip' => trim($this->trip ?? ''),
            'FOnumber' => trim($this->FOnumber ?? ''),
            'comment' => trim($this->comment ?? ''),
        ]);
    }
}
