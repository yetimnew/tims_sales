<?php

namespace Tests\Unit;

use App\Models\DriverTruck;
use App\Models\DriverTruckGradingSetting;
use App\Services\DriverTruckGradeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverTruckGradeServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_grade_uses_persisted_settings(): void
    {
        DriverTruckGradingSetting::query()->create([
            'performance_weight' => 52,
            'efficiency_weight' => 28,
            'consistency_weight' => 20,
            'peer_sample_size' => 12,
            'grade_thresholds' => [
                'A' => 97,
                'B' => 55,
                'C' => 42,
                'D' => 18,
                'E' => 0,
            ],
        ]);

        $assignment = DriverTruck::factory()->create();

        $service = app(DriverTruckGradeService::class);
        $report = $service->grade($assignment);

        $this->assertSame([
            'performance_weight' => 52,
            'efficiency_weight' => 28,
            'consistency_weight' => 20,
        ], $report['weights']);

        $this->assertSame([
            'A' => 97.0,
            'B' => 55.0,
            'C' => 42.0,
            'D' => 18.0,
            'E' => 0.0,
        ], $report['grade_thresholds']);

        $this->assertSame('B', $report['overall']['letter']);
    }
}
