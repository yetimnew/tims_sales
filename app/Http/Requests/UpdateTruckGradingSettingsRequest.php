<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTruckGradingSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('trucks.update') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'utilization_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'efficiency_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'reliability_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'financial_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'compliance_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'peer_sample_size' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->fails()) {
                    return;
                }

                $sum = (int) $this->input('utilization_weight')
                    + (int) $this->input('efficiency_weight')
                    + (int) $this->input('reliability_weight')
                    + (int) $this->input('financial_weight')
                    + (int) $this->input('compliance_weight');

                if ($sum !== 100) {
                    $validator->errors()->add('weights', 'The combined weights must equal 100%.');
                }
            },
        ];
    }

    /**
     * @return array<string, int>
     */
    public function weights(): array
    {
        return [
            'utilization_weight' => (int) $this->input('utilization_weight'),
            'efficiency_weight' => (int) $this->input('efficiency_weight'),
            'reliability_weight' => (int) $this->input('reliability_weight'),
            'financial_weight' => (int) $this->input('financial_weight'),
            'compliance_weight' => (int) $this->input('compliance_weight'),
            'peer_sample_size' => (int) $this->input('peer_sample_size'),
        ];
    }
}
