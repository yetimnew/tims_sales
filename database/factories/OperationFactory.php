<?php

namespace Database\Factories;

use App\Enums\CargoServiceType;
use App\Enums\OperationDestinationScope;
use App\Models\CargoType;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Operation>
 */
class OperationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $destinationScope = OperationDestinationScope::Region;

        return [
            'operationid' => $this->faker->unique()->numerify('OP#####'),
            'customer_id' => Customer::factory(),
            'startdate' => $this->faker->date(),
            'destination_scope' => $destinationScope->value,
            'destination_name' => $this->faker->city(),
            'destination_reference_type' => null,
            'destination_reference_id' => null,
            'volume' => $this->faker->randomFloat(2, 10, 1000),
            'cargo_type_id' => CargoType::factory(),
            'cargo_service_type' => $this->faker->randomElement(CargoServiceType::values()),
            'km' => $this->faker->randomFloat(2, 10, 1000),
            'tariff' => $this->faker->randomFloat(2, 10, 100),
            'status' => $this->faker->randomElement(['active', 'inactive']),
            'closed' => $this->faker->boolean(10),
            'enddate' => $this->faker->optional()->date(),
            'remark' => $this->faker->sentence(),
            'user_id' => User::factory(),
        ];
    }
}
