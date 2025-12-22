<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateDriverGradingWeightsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('drivers.update') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'performance_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'efficiency_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'safety_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'compliance_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'engagement_weight' => ['required', 'integer', 'min:0', 'max:100'],
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
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $sum = (int) $this->input('performance_weight')
                    + (int) $this->input('efficiency_weight')
                    + (int) $this->input('safety_weight')
                    + (int) $this->input('compliance_weight')
                    + (int) $this->input('engagement_weight');

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
            'performance_weight' => (int) $this->input('performance_weight'),
            'efficiency_weight' => (int) $this->input('efficiency_weight'),
            'safety_weight' => (int) $this->input('safety_weight'),
            'compliance_weight' => (int) $this->input('compliance_weight'),
            'engagement_weight' => (int) $this->input('engagement_weight'),
            'peer_sample_size' => (int) $this->input('peer_sample_size'),
        ];
    }
}
