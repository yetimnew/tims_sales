<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Performance>
 */
class PerformanceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'load_phase' => $this->faker->randomElement(['main', 'return']),
            'load_completion' => $this->faker->randomElement(['full', 'partial']),
            'FOnumber' => $this->faker->numerify('FO####'),
            'operation_id' => \App\Models\Operation::factory(),
            'driver_truck_id' => \App\Models\DriverTruck::factory(),
            'DateDispach' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'orgion_id' => \App\Models\Place::factory(),
            'destination_id' => \App\Models\Place::factory(),
            'user_id' => \App\Models\User::factory(),
            'DistanceWCargo' => $this->faker->numberBetween(50, 500),
            'tonkm' => $this->faker->numberBetween(100, 1000),
            'DistanceWOCargo' => $this->faker->numberBetween(10, 100),
            'CargoVolumMT' => $this->faker->numberBetween(5, 50),
            'fuelInLitter' => $this->faker->numberBetween(50, 200),
            'fuelInBirr' => $this->faker->numberBetween(1000, 5000),
            'perdiem' => $this->faker->numberBetween(100, 500),
            'workOnGoing' => $this->faker->boolean(),
            'other' => $this->faker->numberBetween(0, 1000),
            'comment' => $this->faker->sentence(),
            'satus' => $this->faker->randomElement(['completed', 'ongoing', 'cancelled']),
            'is_returned' => $this->faker->boolean(),
        ];
    }
}
