<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDriverRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('drivers.create');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $adultCutoffDate = now()->subYears(18)->toDateString();

        return [
            'driverid' => 'required|string|max:255|unique:drivers',
            'name' => 'required|string|max:255',
            'sex' => 'required|string|in:male,female',
            'birthdate' => [
                'nullable',
                'date',
                "before_or_equal:{$adultCutoffDate}",
            ],
            'zone' => 'nullable|string|max:255',
            'woreda' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'housenumber' => 'nullable|string|max:255',
            'mobile' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^(?:\\+251|251|0)(?:9\\d{8}|7\\d{8})$/',
            ],
            'hireddate' => 'nullable|date|before_or_equal:today',
            'status' => 'required|string|in:active,inactive',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'driverid.unique' => 'A driver with this ID already exists.',
            'driverid.required' => 'Driver ID is required.',
            'name.required' => 'Driver name is required.',
            'sex.in' => 'Gender must be either male or female.',
            'birthdate.before_or_equal' => 'Birth date must show the driver is at least 18 years old.',
            'mobile.regex' => 'Mobile number must be a valid Ethiopian Ethio Telecom or Safaricom number.',
            'hireddate.before_or_equal' => 'Hired date cannot be in the future.',
            'status.in' => 'Status must be either active or inactive.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'driverid' => trim($this->driverid ?? ''),
            'name' => mb_strtoupper(trim($this->name ?? ''), 'UTF-8'),
            'mobile' => trim($this->mobile ?? ''),
            'zone' => trim($this->zone ?? ''),
            'woreda' => trim($this->woreda ?? ''),
            'kebele' => trim($this->kebele ?? ''),
            'housenumber' => trim($this->housenumber ?? ''),
        ]);
    }
}
