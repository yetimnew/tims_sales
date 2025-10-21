<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Driver>
 */
class DriverFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'driverid' => $this->faker->unique()->numerify('DRV####'),
            'name' => $this->faker->name(),
            'sex' => $this->faker->randomElement(['male', 'female']),
            'birthdate' => $this->faker->dateTimeBetween('-50 years', '-18 years'),
            'zone' => $this->faker->city(),
            'woreda' => $this->faker->citySuffix(),
            'kebele' => $this->faker->numerify('##'),
            'housenumber' => $this->faker->numerify('###'),
            'mobile' => $this->faker->phoneNumber(),
            'hireddate' => $this->faker->dateTimeBetween('-10 years', 'now'),
            'status' => $this->faker->randomElement(['active', 'inactive', 'suspended']),
        ];
    }
}
