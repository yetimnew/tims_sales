<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FuelRecord>
 */
class FuelRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fuelQuantity = $this->faker->randomFloat(2, 40, 400);
        $fuelPrice = $this->faker->randomFloat(2, 25, 80);

        return [
            'truck_id' => \App\Models\Truck::factory(),
            'driver_id' => \App\Models\Driver::factory(),
            'fuel_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'fuel_quantity_liters' => $fuelQuantity,
            'fuel_price_per_liter' => $fuelPrice,
            'total_cost' => round($fuelQuantity * $fuelPrice, 2),
            'fuel_station' => $this->faker->company(),
            'fuel_type' => $this->faker->randomElement(['diesel', 'petrol', 'gas']),
            'odometer_reading' => $this->faker->numberBetween(5_000, 600_000),
            'receipt_number' => strtoupper($this->faker->bothify('RCPT-####')),
            'notes' => $this->faker->sentence(),
            'user_id' => \App\Models\User::factory(),
            'driver_truck_id' => null,
        ];
    }
}
