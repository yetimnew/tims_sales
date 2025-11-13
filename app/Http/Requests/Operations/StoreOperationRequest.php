<?php

namespace App\Http\Requests\Operations;

use App\Enums\CargoServiceType;
use App\Enums\OperationDestinationScope;
use App\Models\Place;
use App\Models\Region;
use App\Models\Woreda;
use App\Models\Zone;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOperationRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'operationid' => ['required', 'string', 'max:255', 'unique:operations,operationid'],
            'customer_id' => ['required', 'exists:customers,id'],
            'startdate' => ['required', 'date'],
            'volume' => ['required', 'numeric', 'min:0'],
            'cargo_type_id' => ['required', 'exists:cargo_types,id'],
            'cargo_service_type' => ['required', 'string', Rule::in(CargoServiceType::values())],
            'km' => ['required', 'numeric', 'min:0'],
            'tariff' => ['required', 'numeric', 'min:0'],
            'remark' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', 'string', 'in:active,inactive'],
            'destination_scope' => ['required', 'string', Rule::in(OperationDestinationScope::values())],
            'destination_id' => ['required', 'integer', 'min:1', $this->destinationExistsRule()],
        ];
    }

    /**
     * Ensure the destination identifier exists for the selected scope.
     */
    private function destinationExistsRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $scope = OperationDestinationScope::tryFrom((string) $this->input('destination_scope'));

            if (! $scope) {
                $fail(__('The selected destination is invalid.'));

                return;
            }

            $exists = match ($scope) {
                OperationDestinationScope::Region => Region::query()->whereKey($value)->exists(),
                OperationDestinationScope::Zone => Zone::query()->whereKey($value)->exists(),
                OperationDestinationScope::Woreda => Woreda::query()->whereKey($value)->exists(),
                OperationDestinationScope::Place => Place::query()->whereKey($value)->exists(),
            };

            if (! $exists) {
                $fail(__('The selected destination is invalid.'));
            }
        };
    }
}
