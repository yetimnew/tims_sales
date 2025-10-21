<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePerformanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'trip' => 'required|string|max:255',
            'LoadType' => 'required|string|in:main,return,empty',
            'FOnumber' => 'required|string|max:255',
            'operation_id' => 'required|exists:operations,id',
            'driver_truck_id' => 'required|exists:driver_truck,id',
            'DateDispach' => 'required|date|before_or_equal:today',
            'orgion_id' => 'required|exists:places,id',
            'destination_id' => 'required|exists:places,id|different:orgion_id',
            'DistanceWCargo' => 'nullable|numeric|min:0|max:99999.99',
            'tonkm' => 'nullable|numeric|min:0|max:999999.99',
            'DistanceWOCargo' => 'nullable|numeric|min:0|max:99999.99',
            'CargoVolumMT' => 'nullable|numeric|min:0|max:999.99',
            'fuelInLitter' => 'nullable|numeric|min:0|max:9999.99',
            'fuelInBirr' => 'nullable|numeric|min:0|max:999999.99',
            'perdiem' => 'nullable|numeric|min:0|max:99999.99',
            'workOnGoing' => 'nullable|numeric|min:0|max:99999.99',
            'other' => 'nullable|numeric|min:0|max:99999.99',
            'comment' => 'nullable|string|max:1000',
            'satus' => 'required|string|in:active,inactive',
            'is_returned' => 'boolean',
            'returned_date' => 'nullable|date|after_or_equal:DateDispach',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'LoadType.in' => 'Load type must be main, return, or empty',
            'destination_id.different' => 'Destination must be different from origin',
            'DateDispach.before_or_equal' => 'Dispatch date cannot be in the future',
            'returned_date.after_or_equal' => 'Return date must be after dispatch date',
            'DistanceWCargo.min' => 'Distance with cargo cannot be negative',
            'CargoVolumMT.max' => 'Cargo volume cannot exceed 999.99 MT',
            'fuelInLitter.max' => 'Fuel consumption cannot exceed 9999.99 liters',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'trip' => strtoupper(trim($this->trip ?? '')),
            'FOnumber' => strtoupper(trim($this->FOnumber ?? '')),
            'comment' => trim($this->comment ?? ''),
        ]);
    }
}

