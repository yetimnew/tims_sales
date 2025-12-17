<?php

namespace Database\Factories;

use App\Models\StatusType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Status>
 */
class StatusFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'statustype_id' => StatusType::factory(),
            'name' => $this->faker->unique()->words(2, true),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}
