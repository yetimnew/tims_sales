<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Truck>
 */
class TruckFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'plate' => $this->faker->unique()->regexify('[A-Z]{2}[0-9]{4}[A-Z]{2}'),
            'vehicletype_id' => \App\Models\VehicleType::factory(),
            'chasisNumber' => $this->faker->unique()->numerify('CHASIS########'),
            'engineNumber' => $this->faker->unique()->numerify('ENGINE########'),
            'tyreSyze' => $this->faker->randomElement(['225/75R16', '235/75R15', '245/70R16']),
            'serviceIntervalKM' => $this->faker->numberBetween(10000, 50000),
            'purchasePrice' => $this->faker->randomFloat(2, 500000, 2000000),
            'productionDate' => $this->faker->dateTimeBetween('-10 years', '-1 year'),
            'serviceStartDate' => $this->faker->dateTimeBetween('-5 years', 'now'),
            'status' => $this->faker->randomElement(['active', 'inactive', 'maintenance', 'retired']),
        ];
    }
}
