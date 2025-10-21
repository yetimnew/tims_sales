<?php

namespace Database\Factories;

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
        return [
            'operation' => $this->faker->sentence(3),
            'customer_id' => \App\Models\Customer::factory(),
            'startdate' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'enddate' => $this->faker->dateTimeBetween('now', '+1 year'),
            'volume' => $this->faker->randomFloat(2, 10, 100),
            'km' => $this->faker->numberBetween(100, 1000),
            'tariff' => $this->faker->randomFloat(2, 1000, 10000),
            'closed' => $this->faker->boolean(),
        ];
    }
}
