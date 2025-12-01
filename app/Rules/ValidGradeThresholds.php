<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidGradeThresholds implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_array($value)) {
            $fail('Provide thresholds for each grade.');

            return;
        }

        $thresholds = $value;

        $letters = ['A', 'B', 'C', 'D'];
        $previous = 100.0;

        foreach ($letters as $letter) {
            $raw = $thresholds[$letter] ?? null;

            if ($raw === null || $raw === '') {
                $fail(sprintf('Grade %s threshold is required.', $letter));

                return;
            }

            if (! is_numeric($raw)) {
                $fail(sprintf('Grade %s threshold must be a number between 0 and 100.', $letter));

                return;
            }

            $numeric = (float) $raw;

            if ($numeric < 0 || $numeric > 100) {
                $fail(sprintf('Grade %s threshold must be between 0 and 100.', $letter));

                return;
            }

            if ($numeric > $previous) {
                $fail('Each grade threshold must be less than or equal to the one before it.');

                return;
            }

            $previous = $numeric;
        }

        $gradeE = $thresholds['E'] ?? null;

        if ($gradeE === null || $gradeE === '') {
            $fail('Grade E threshold must be 0.');

            return;
        }

        if (! is_numeric($gradeE) || (float) $gradeE !== 0.0) {
            $fail('Grade E threshold must be 0.');
        }
    }
}
