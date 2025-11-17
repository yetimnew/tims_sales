<?php

namespace Database\Factories;

use App\Models\Outsource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Outsource>
 */
class OutsourceFactory extends Factory
{
    protected $model = Outsource::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->company(),
            'contact_person' => $this->faker->name(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->safeEmail(),
            'address' => $this->faker->address(),
            'service_type' => $this->faker->randomElement(['Long Haul', 'Bulk Cargo', 'Fuel Logistics']),
            'status' => $this->faker->randomElement(['active', 'inactive']),
        ];
    }
}
