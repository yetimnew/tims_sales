<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DriverTruck>
 */
class DriverTruckFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $assignedDate = $this->faker->dateTimeBetween('-6 months', 'now');

        return [
            'driver_id' => \App\Models\Driver::factory(),
            'truck_id' => \App\Models\Truck::factory(),
            'driverid' => $this->faker->unique()->regexify('DRV[0-9]{4}'),
            'plate' => $this->faker->unique()->regexify('[A-Z]{2}-[0-9]{4}'),
            'assigned_date' => $assignedDate,
            'unassigned_date' => null,
            'date_recived' => $assignedDate,
            'date_detach' => null,
            'reason' => null,
            'is_attached' => true,
            'status' => 'active',
            'user_id' => \App\Models\User::factory(),
        ];
    }
}
