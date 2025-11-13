<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MaintenanceType>
 */
class MaintenanceTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->randomElement([
                'Oil Change',
                'Brake Service',
                'Transmission Inspection',
                'Coolant Flush',
            ]),
            'category' => $this->faker->randomElement(['preventive', 'corrective', 'emergency']),
            'interval_km' => $this->faker->numberBetween(5000, 50000),
            'interval_months' => $this->faker->numberBetween(3, 24),
            'estimated_cost' => $this->faker->randomFloat(2, 500, 15000),
            'description' => $this->faker->sentence(),
            'is_active' => true,
        ];
    }
}
