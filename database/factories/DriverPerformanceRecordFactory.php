<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DriverPerformanceRecord>
 */
class DriverPerformanceRecordFactory extends Factory
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
            'truck_id' => \App\Models\Truck::factory(),
            'record_date' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'total_trips' => $this->faker->numberBetween(10, 100),
            'total_distance_km' => $this->faker->numberBetween(1000, 10000),
            'total_cargo_tonnage' => $this->faker->numberBetween(50, 500),
            'fuel_efficiency' => $this->faker->randomFloat(2, 5, 15),
            'safety_violations' => $this->faker->numberBetween(0, 5),
            'accidents' => $this->faker->numberBetween(0, 2),
            'customer_rating' => $this->faker->randomFloat(1, 1, 5),
            'performance_notes' => $this->faker->sentence(),
            'period_type' => $this->faker->randomElement(['daily', 'weekly', 'monthly']),
        ];
    }
}
