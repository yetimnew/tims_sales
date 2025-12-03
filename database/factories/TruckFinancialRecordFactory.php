<?php

namespace Database\Factories;

use App\Models\Truck;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\TruckFinancialRecord>
 */
class TruckFinancialRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $recordDate = $this->faker->dateTimeBetween('-90 days', 'now');

        return [
            'truck_id' => Truck::factory(),
            'record_date' => $recordDate,
            'revenue' => $this->faker->randomFloat(2, 1000, 15000),
            'fuel_cost' => $this->faker->randomFloat(2, 500, 5000),
            'maintenance_cost' => $this->faker->randomFloat(2, 200, 2500),
            'driver_salary' => $this->faker->randomFloat(2, 300, 4000),
            'insurance_cost' => $this->faker->randomFloat(2, 100, 1500),
            'depreciation' => $this->faker->randomFloat(2, 100, 2000),
            'other_costs' => $this->faker->randomFloat(2, 0, 1500),
            'net_profit' => $this->faker->randomFloat(2, 200, 8000),
            'period_type' => $this->faker->randomElement(['daily', 'weekly', 'monthly']),
        ];
    }
}
