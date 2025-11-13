<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Region>
 */
class RegionFactory extends Factory
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
            'code' => $this->faker->unique()->regexify('[A-Z]{2}'),
            'description' => $this->faker->sentence(),
            'status' => 'active',
            'capital' => $this->faker->city(),
            'area_km2' => $this->faker->randomFloat(2, 1000, 500000),
            'population' => $this->faker->numberBetween(50000, 5000000),
            'latitude' => $this->faker->latitude(),
            'longitude' => $this->faker->longitude(),
            'elevation_m' => $this->faker->randomFloat(2, 500, 3000),
            'accessibility_score' => $this->faker->randomFloat(2, 0, 100),
            'last_surveyed_at' => $this->faker->optional()->date(),
            'infrastructure_notes' => $this->faker->optional()->sentence(),
            'climate_profile' => $this->faker->optional()->sentence(),
        ];
    }
}
