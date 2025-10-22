<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFuelRequest extends FormRequest
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
            'truck_id' => 'required|exists:trucks,id',
            'driver_id' => 'required|exists:drivers,id',
            'fuel_date' => 'required|date|before_or_equal:today',
            'fuel_quantity_liters' => 'required|numeric|min:0.01|max:9999.99',
            'fuel_price_per_liter' => 'required|numeric|min:0.01|max:999.99',
            'fuel_station' => 'nullable|string|max:255',
            'fuel_type' => 'required|string|in:diesel,petrol,gas',
            'odometer_reading' => 'nullable|integer|min:0',
            'receipt_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'fuel_quantity_liters.min' => 'Fuel quantity must be at least 0.01 liters',
            'fuel_quantity_liters.max' => 'Fuel quantity cannot exceed 9,999.99 liters',
            'fuel_price_per_liter.min' => 'Fuel price must be at least 0.01',
            'fuel_price_per_liter.max' => 'Fuel price cannot exceed 999.99',
            'fuel_date.before_or_equal' => 'Fuel date cannot be in the future',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'fuel_station' => trim($this->fuel_station ?? ''),
            'receipt_number' => trim($this->receipt_number ?? ''),
            'notes' => trim($this->notes ?? ''),
        ]);
    }
}
