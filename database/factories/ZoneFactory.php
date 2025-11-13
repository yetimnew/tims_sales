<?php

namespace Database\Factories;

use App\Models\Region;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Zone>
 */
class ZoneFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->citySuffix(),
            'code' => $this->faker->unique()->regexify('[A-Z]{3}'),
            'region_id' => Region::factory(),
            'description' => $this->faker->sentence(),
            'status' => 'active',
            'administrative_center' => $this->faker->city(),
            'area_km2' => $this->faker->randomFloat(2, 500, 100000),
            'population' => $this->faker->numberBetween(20000, 2000000),
            'latitude' => $this->faker->latitude(),
            'longitude' => $this->faker->longitude(),
            'elevation_m' => $this->faker->randomFloat(2, 400, 3000),
            'accessibility_score' => $this->faker->randomFloat(2, 0, 100),
            'infrastructure_notes' => $this->faker->optional()->sentence(),
            'climate_profile' => $this->faker->optional()->sentence(),
        ];
    }
}
