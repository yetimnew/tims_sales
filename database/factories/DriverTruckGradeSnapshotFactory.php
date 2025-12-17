<?php

namespace Database\Factories;

use App\Models\DriverTruck;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DriverTruckGradeSnapshot>
 */
class DriverTruckGradeSnapshotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $scoreToLetter = static function (float $score): string {
            if ($score >= 90) {
                return 'A';
            }

            if ($score >= 80) {
                return 'B';
            }

            if ($score >= 70) {
                return 'C';
            }

            if ($score >= 60) {
                return 'D';
            }

            return 'E';
        };

        $overallScore = $this->faker->randomFloat(1, 55, 100);
        $overallLetter = $scoreToLetter($overallScore);

        $categories = [
            'performance' => [
                'score' => $this->faker->randomFloat(1, 55, 100),
            ],
            'efficiency' => [
                'score' => $this->faker->randomFloat(1, 55, 100),
            ],
            'consistency' => [
                'score' => $this->faker->randomFloat(1, 55, 100),
            ],
        ];

        return [
            'snapshot_date' => $this->faker->date(),
            'driver_truck_id' => DriverTruck::factory(),
            'driver_id' => null,
            'truck_id' => null,
            'status' => $this->faker->randomElement(['active', 'inactive', 'reassigned']),
            'is_attached' => $this->faker->boolean(),
            'filter_status' => null,
            'filter_is_attached' => null,
            'overall_score' => $overallScore,
            'overall_letter' => $overallLetter,
            'weights' => [
                'performance_weight' => 40,
                'efficiency_weight' => 35,
                'consistency_weight' => 25,
            ],
            'categories' => $categories,
            'metrics' => [
                'total_trips' => $this->faker->numberBetween(0, 120),
                'km_per_liter' => $this->faker->randomFloat(2, 2, 10),
            ],
            'grade_thresholds' => [
                'A' => 90,
                'B' => 80,
                'C' => 70,
                'D' => 60,
                'E' => 0,
            ],
            'calculated_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
            'calculated_by' => User::factory(),
        ];
    }
}
