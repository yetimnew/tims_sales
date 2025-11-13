<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VehicleMaintenanceRecord>
 */
class VehicleMaintenanceRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = $this->faker->randomElement(['scheduled', 'in_progress', 'completed', 'overdue']);

        if ($status === 'completed') {
            $scheduledDate = $this->faker->dateTimeBetween('-2 months', '-1 week');
            $completedDate = $this->faker->dateTimeBetween($scheduledDate, 'now');
        } elseif ($status === 'overdue') {
            $scheduledDate = $this->faker->dateTimeBetween('-2 months', '-1 day');
            $completedDate = null;
        } else {
            $scheduledDate = $this->faker->dateTimeBetween('now', '+1 month');
            $completedDate = null;
        }

        return [
            'truck_id' => \App\Models\Truck::factory(),
            'maintenance_type_id' => \App\Models\MaintenanceType::factory(),
            'scheduled_date' => $scheduledDate,
            'completed_date' => $completedDate,
            'odometer_reading' => $this->faker->numberBetween(5_000, 500_000),
            'cost' => $this->faker->randomFloat(2, 250, 25_000),
            'description' => $this->faker->sentence(),
            'work_performed' => $this->faker->sentence(),
            'parts_replaced' => $this->faker->sentence(),
            'service_provider' => $this->faker->company(),
            'status' => $status,
            'assigned_mechanic_id' => \App\Models\User::factory(),
            'user_id' => \App\Models\User::factory(),
        ];
    }
}
