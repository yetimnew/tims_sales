<?php

namespace Database\Factories;

use App\Enums\CargoCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\CargoType>
 */
class CargoTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $category = $this->faker->randomElement(CargoCategory::cases());

        return [
            'name' => $this->faker->unique()->words(2, true),
            'category' => $category->value,
            'weight_per_cubic_meter' => $this->faker->randomFloat(2, 50, 1500),
            'handling_requirements' => $this->faker->sentence(),
            'safety_requirements' => $this->faker->sentence(),
            'requires_special_equipment' => $this->faker->boolean(20),
        ];
    }
}
