<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class DriverTruckGradingReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reports.driver-truck-grading.view') ?? false;
    }

    public function rules(): array
    {
        return [
            'snapshot_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:40'],
            'attachment_state' => ['nullable', 'string', 'in:attached,detached'],
            'grade_letter' => ['nullable', 'string', 'in:A,B,C,D,E'],
            'per_page' => ['nullable', 'integer'],
        ];
    }
}
