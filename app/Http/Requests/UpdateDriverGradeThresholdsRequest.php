<?php

namespace App\Http\Requests;

use App\Models\DriverGradingSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateDriverGradeThresholdsRequest extends FormRequest
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
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $thresholds = $this->input('grade_thresholds');

                if (! is_array($thresholds)) {
                    $validator->errors()->add('grade_thresholds', 'Provide thresholds for each grade.');

                    return;
                }

                $previous = 100.0;

                foreach (['A', 'B', 'C', 'D'] as $letter) {
                    $value = $thresholds[$letter] ?? null;

                    if ($value === null || $value === '') {
                        $validator->errors()->add("grade_thresholds.$letter", sprintf('Grade %s threshold is required.', $letter));

                        return;
                    }

                    $numeric = (float) $value;

                    if ($numeric > $previous) {
                        $validator->errors()->add('grade_thresholds', 'Each grade threshold must be less than or equal to the one above it.');

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
     * @return array<string, float>
     */
    public function gradeThresholds(): array
    {
        return DriverGradingSetting::normalizeGradeThresholds(
            $this->input('grade_thresholds') ?? [],
        );
    }
}
