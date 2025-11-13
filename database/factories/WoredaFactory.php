<?php

namespace Database\Factories;

use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Woreda>
 */
class WoredaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->city(),
            'code' => $this->faker->unique()->regexify('[A-Z]{4}'),
            'zone_id' => Zone::factory(),
            'description' => $this->faker->sentence(),
            'status' => 'active',
            'administrative_center' => $this->faker->city(),
            'area_km2' => $this->faker->randomFloat(2, 100, 50000),
            'population' => $this->faker->numberBetween(10000, 1000000),
            'latitude' => $this->faker->latitude(),
            'longitude' => $this->faker->longitude(),
            'elevation_m' => $this->faker->randomFloat(2, 300, 2800),
            'accessibility_score' => $this->faker->randomFloat(2, 0, 100),
            'infrastructure_notes' => $this->faker->optional()->sentence(),
            'road_quality_notes' => $this->faker->optional()->sentence(),
        ];
    }
}
