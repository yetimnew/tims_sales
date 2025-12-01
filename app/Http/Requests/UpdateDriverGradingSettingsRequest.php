<?php

namespace App\Http\Requests;

use App\Models\DriverGradingSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateDriverGradingSettingsRequest extends FormRequest
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
            'grade_thresholds' => ['required', 'array'],
            'grade_thresholds.A' => ['required', 'numeric', 'min:0', 'max:100'],
            'grade_thresholds.B' => ['required', 'numeric', 'min:0', 'max:100'],
            'grade_thresholds.C' => ['required', 'numeric', 'min:0', 'max:100'],
            'grade_thresholds.D' => ['required', 'numeric', 'min:0', 'max:100'],
            'grade_thresholds.E' => ['nullable', 'numeric', 'min:0', 'max:100'],
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

                $sum = (int) $this->input('performance_weight')
                    + (int) $this->input('efficiency_weight')
                    + (int) $this->input('safety_weight')
                    + (int) $this->input('compliance_weight')
                    + (int) $this->input('engagement_weight');

                if ($sum !== 100) {
                    $validator->errors()->add('weights', 'The combined weights must equal 100%.');
                }

                $thresholds = $this->input('grade_thresholds');

                if (! is_array($thresholds)) {
                    $validator->errors()->add('grade_thresholds', 'Provide thresholds for each grade.');

                    return;
                }

                $letters = ['A', 'B', 'C', 'D'];
                $previous = 100.0;

                foreach ($letters as $letter) {
                    $value = $thresholds[$letter] ?? null;

                    if ($value === null || $value === '') {
                        $validator->errors()->add("grade_thresholds.$letter", sprintf('Grade %s threshold is required.', $letter));

                        return;
                    }

                    $numeric = (float) $value;

                    if ($numeric > $previous) {
                        $validator->errors()->add('grade_thresholds', 'Each grade threshold must be less than or equal to the one before it.');

                        return;
                    }

                    $previous = $numeric;
                }

                $gradeE = $thresholds['E'] ?? null;

                if ($gradeE !== null && (float) $gradeE !== 0.0) {
                    $validator->errors()->add('grade_thresholds.E', 'Grade E threshold must be 0.');
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

    /**
     * @return array<string, float>
     */
    public function gradeThresholds(): array
    {
        return DriverGradingSetting::normalizeGradeThresholds(
            $this->input('grade_thresholds') ?? [],
        );
    }
}
