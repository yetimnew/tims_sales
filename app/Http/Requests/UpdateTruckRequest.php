<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTruckRequest extends FormRequest
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
        $truckId = $this->route('truck')->id ?? null;

        return [
            'plate' => [
                'required',
                'string',
                'max:255',
                'unique:trucks,plate'.($truckId ? ','.$truckId : ''),
                'regex:/^[A-Z]{2,4}-[0-9]{3,5}$/', // Ethiopian plate format (allows 2-4 letters and 3-5 digits)
            ],
            'vehicletype_id' => 'required|exists:vehicletypes,id',
            'chasisNumber' => 'nullable|string|max:255',
            'engineNumber' => 'nullable|string|max:255',
            'tyreSyze' => 'nullable|string|max:255',
            'serviceIntervalKM' => 'nullable|integer|min:1000|max:100000',
            'purchasePrice' => 'nullable|numeric|min:0|max:999999999.99',
            'productionDate' => 'nullable|date|before_or_equal:today',
            'serviceStartDate' => 'nullable|date|after_or_equal:productionDate',
            'status' => 'required|string|in:active,inactive',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'plate.regex' => 'Plate number must follow Ethiopian format (e.g., AA-1234)',
            'serviceStartDate.after_or_equal' => 'Service start date must be after production date',
            'serviceIntervalKM.min' => 'Service interval must be at least 1000 KM',
            'serviceIntervalKM.max' => 'Service interval cannot exceed 100,000 KM',
            'purchasePrice.min' => 'Purchase price cannot be negative',
            'purchasePrice.max' => 'Purchase price cannot exceed 999,999,999.99',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'plate' => strtoupper(trim($this->plate ?? '')),
            'chasisNumber' => trim($this->chasisNumber ?? ''),
            'engineNumber' => trim($this->engineNumber ?? ''),
            'tyreSyze' => trim($this->tyreSyze ?? ''),
        ]);
    }
}
