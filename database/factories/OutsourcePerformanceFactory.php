<?php

namespace Database\Factories;

use App\Models\OutsourcePerformance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OutsourcePerformance>
 */
class OutsourcePerformanceFactory extends Factory
{
    protected $model = OutsourcePerformance::class;

    public function definition(): array
    {
        $distance = $this->faker->randomFloat(2, 50, 1500);
        $cargo = $this->faker->randomFloat(2, 5, 60);
        $tonKm = round($distance * $cargo, 2);

        return [
            'outsource_id' => \App\Models\Outsource::factory(),
            'operation_id' => \App\Models\Operation::factory(),
            'trip_number' => $this->faker->unique()->numerify('OUT-#####'),
            'dispatch_date' => $this->faker->dateTimeBetween('-2 months', 'now'),
            'from_place_id' => \App\Models\Place::factory(),
            'to_place_id' => \App\Models\Place::factory(),
            'distance_km' => $distance,
            'cargo_volume_mt' => $cargo,
            'tonkm' => $tonKm,
            'cost' => $this->faker->randomFloat(2, 10000, 500000),
            'remarks' => $this->faker->sentence(),
            'status' => $this->faker->randomElement(['active', 'in_transit', 'completed', 'cancelled']),
            'user_id' => \App\Models\User::factory(),
        ];
    }
}
