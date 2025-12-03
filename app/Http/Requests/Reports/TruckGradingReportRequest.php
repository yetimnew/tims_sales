<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class TruckGradingReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can('reports.truck-grading.view');
    }

    public function rules(): array
    {
        return [
            'snapshot_date' => ['nullable', 'date'],
            'vehicle_type_id' => ['nullable', 'integer', 'exists:vehicletypes,id'],
            'status' => ['nullable', 'string', 'max:40'],
            'grade_letter' => ['nullable', 'string', 'in:A,B,C,D,E'],
            'per_page' => ['nullable', 'integer'],
        ];
    }
}
