<?php

namespace App\Http\Requests;

use App\Enums\CargoCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCargoTypeRequest extends FormRequest
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
            'name' => 'required|string|max:255|unique:cargo_types',
            'category' => ['required', Rule::enum(CargoCategory::class)],
            'weight_per_cubic_meter' => 'nullable|numeric|min:0|max:9999.99',
            'handling_requirements' => 'nullable|string|max:2000',
            'safety_requirements' => 'nullable|string|max:2000',
            'requires_special_equipment' => 'boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'A cargo type with this name already exists.',
            'category.enum' => 'Please choose a valid cargo category.',
            'weight_per_cubic_meter.max' => 'Weight per cubic meter cannot exceed 9,999.99.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim($this->name ?? ''),
            'category' => is_string($this->category) ? trim($this->category) : $this->category,
            'handling_requirements' => trim($this->handling_requirements ?? ''),
            'safety_requirements' => trim($this->safety_requirements ?? ''),
        ]);
    }
}
