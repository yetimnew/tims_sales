<?php

namespace App\Http\Requests;

use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\Truck;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDriverTruckRequest extends FormRequest
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
            'truck_id' => [
                'required',
                'exists:trucks,id',
                Rule::exists('trucks')->where(function ($query) {
                    $query->where('status', 'active');
                }),
                function ($attribute, $value, $fail) {
                    // Check if truck is already assigned to another driver
                    $existingAssignment = DriverTruck::where('truck_id', $value)
                        ->where('status', 'active')
                        ->where('is_attached', true)
                        ->first();

                    if ($existingAssignment) {
                        $fail('This truck is already assigned to another driver.');
                    }
                },
            ],
            'driver_id' => [
                'required',
                'exists:drivers,id',
                Rule::exists('drivers')->where(function ($query) {
                    $query->where('status', 'active');
                }),
                function ($attribute, $value, $fail) {
                    // Check if driver is already assigned to another truck
                    $existingAssignment = DriverTruck::where('driver_id', $value)
                        ->where('status', 'active')
                        ->where('is_attached', true)
                        ->first();

                    if ($existingAssignment) {
                        $fail('This driver is already assigned to another truck.');
                    }
                },
                function ($attribute, $value, $fail) {
                    // Check if this driver-truck combination already exists
                    $truckId = $this->input('truck_id');
                    if ($truckId) {
                        $existingAssignment = DriverTruck::where('driver_id', $value)
                            ->where('truck_id', $truckId)
                            ->where('status', 'active')
                            ->first();

                        if ($existingAssignment) {
                            $fail('This driver and truck are already assigned.');
                        }
                    }
                },
            ],
            'date_recived' => [
                'required',
                'date',
                'before_or_equal:today',
                'after_or_equal:' . now()->subDays(30)->format('Y-m-d'), // Not more than 30 days in the past
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'truck_id.exists' => 'Selected truck does not exist or is inactive.',
            'driver_id.exists' => 'Selected driver does not exist or is inactive.',
            'date_recived.before_or_equal' => 'Assignment date cannot be in the future.',
            'date_recived.after_or_equal' => 'Assignment date cannot be more than 30 days in the past.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Get driver and truck details for validation
        $driverId = $this->input('driver_id');
        $truckId = $this->input('truck_id');

        if ($driverId && $truckId) {
            $driver = Driver::find($driverId);
            $truck = Truck::find($truckId);

            if ($driver && $truck) {
                // Auto-populate fields from related models
                $this->merge([
                    'driverid' => $driver->driverid,
                    'plate' => $truck->plate,
                ]);
            }
        }
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Additional business logic validation can be added here
            $driverId = $this->input('driver_id');
            $truckId = $this->input('truck_id');

            if ($driverId && $truckId) {
                // Check if driver has any pending assignments that need to be resolved
                $pendingAssignments = DriverTruck::where('driver_id', $driverId)
                    ->where('status', 'active')
                    ->whereNull('date_detach')
                    ->where('is_attached', false)
                    ->count();

                if ($pendingAssignments > 0) {
                    $validator->errors()->add('driver_id', 'Driver has pending assignments that need to be resolved first.');
                }
            }
        });
    }
}
