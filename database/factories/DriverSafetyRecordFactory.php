<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DriverSafetyRecord>
 */
class DriverSafetyRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'driver_id' => \App\Models\Driver::factory(),
            'reported_by' => \App\Models\User::factory(),
            'incident_date' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'incident_type' => $this->faker->randomElement(['accident', 'violation', 'near_miss', 'equipment_failure']),
            'description' => $this->faker->sentence(),
            'severity' => $this->faker->randomElement(['low', 'medium', 'high', 'critical']),
            'damage_cost' => $this->faker->randomFloat(2, 0, 50000),
            'location' => $this->faker->address(),
            'resolution' => $this->faker->sentence(),
            'reported_by' => $this->faker->name(),
        ];
    }
}
