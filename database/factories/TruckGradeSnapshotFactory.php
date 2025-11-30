<?php

namespace Database\Factories;

use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TruckGradeSnapshot>
 */
class TruckGradeSnapshotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $scoreToLetter = static function (float $score): string {
            if ($score >= 85) {
                return 'A';
            }

            if ($score >= 75) {
                return 'B';
            }

            if ($score >= 65) {
                return 'C';
            }

            if ($score >= 55) {
                return 'D';
            }

            return 'E';
        };

        $overallScore = $this->faker->numberBetween(60, 98) + $this->faker->randomFloat(2, 0, 1);
        $overallLetter = $scoreToLetter($overallScore);

        $categoryScores = [
            'availability' => $this->faker->numberBetween(60, 98) + $this->faker->randomFloat(2, 0, 1),
            'utilization' => $this->faker->numberBetween(60, 98) + $this->faker->randomFloat(2, 0, 1),
            'cost_efficiency' => $this->faker->numberBetween(60, 98) + $this->faker->randomFloat(2, 0, 1),
        ];

        $weights = [
            'availability' => 0.35,
            'utilization' => 0.35,
            'cost_efficiency' => 0.30,
        ];

        $gradeThresholds = [
            'A' => 85,
            'B' => 75,
            'C' => 65,
            'D' => 55,
            'E' => 0,
        ];

        $categories = [];

        foreach ($categoryScores as $key => $score) {
            $categories[$key] = [
                'score' => round($score, 2),
                'letter' => $scoreToLetter($score),
            ];
        }

        return [
            'snapshot_date' => $this->faker->date(),
            'truck_id' => Truck::factory(),
            'vehicle_type_id' => VehicleType::factory(),
            'status' => $this->faker->randomElement(['active', 'inactive', 'maintenance', 'retired']),
            'filter_vehicle_type_id' => null,
            'filter_status' => null,
            'overall_score' => round($overallScore, 2),
            'overall_letter' => $overallLetter,
            'weights' => $weights,
            'categories' => $categories,
            'metrics' => [
                'uptime_percent' => $this->faker->numberBetween(70, 100),
                'maintenance_cost_per_km' => $this->faker->randomFloat(2, 0.5, 4.0),
                'fuel_efficiency_score' => $this->faker->numberBetween(60, 98),
            ],
            'grade_thresholds' => $gradeThresholds,
            'calculated_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
            'calculated_by' => User::factory(),
        ];
    }
}
