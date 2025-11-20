<?php

namespace Tests\Unit\Services;

use App\Models\Driver;
use App\Services\DriverMetricsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverMetricsServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_calculates_metrics_without_filters(): void
    {
        Driver::factory()->create([
            'status' => 'active',
            'sex' => 'male',
        ]);

        Driver::factory()->create([
            'status' => 'active',
            'sex' => 'female',
        ]);

        Driver::factory()->create([
            'status' => 'inactive',
            'sex' => 'male',
        ]);

        Driver::factory()->create([
            'status' => 'inactive',
            'sex' => 'female',
        ]);

        $service = new DriverMetricsService;

        $metrics = $service->metrics(null, null, null);

        $this->assertSame(4, $metrics['total']);
        $this->assertSame(2, $metrics['active']);
        $this->assertSame(2, $metrics['inactive']);
        $this->assertSame(2, $metrics['male']);
        $this->assertSame(2, $metrics['female']);
    }

    public function test_it_applies_search_filter_to_metrics(): void
    {
        Driver::factory()->create([
            'name' => 'Alice Anderson',
            'driverid' => 'DRV1001',
            'status' => 'active',
            'sex' => 'female',
        ]);

        Driver::factory()->create([
            'name' => 'Bob Brown',
            'driverid' => 'DRV2002',
            'status' => 'inactive',
            'sex' => 'male',
        ]);

        $service = new DriverMetricsService;

        $metrics = $service->metrics('Alice', null, null);

        $this->assertSame(1, $metrics['total']);
        $this->assertSame(1, $metrics['active']);
        $this->assertSame(0, $metrics['inactive']);
        $this->assertSame(0, $metrics['male']);
        $this->assertSame(1, $metrics['female']);
    }

    public function test_it_applies_sex_filter_to_metrics(): void
    {
        Driver::factory()->count(2)->create([
            'sex' => 'male',
            'status' => 'active',
        ]);

        Driver::factory()->count(2)->create([
            'sex' => 'female',
            'status' => 'inactive',
        ]);

        $service = new DriverMetricsService;

        $metrics = $service->metrics(null, 'male', null);

        $this->assertSame(2, $metrics['total']);
        $this->assertSame(2, $metrics['active']);
        $this->assertSame(0, $metrics['inactive']);
        $this->assertSame(2, $metrics['male']);
        $this->assertSame(0, $metrics['female']);
    }

    public function test_it_applies_status_filter_to_metrics(): void
    {
        Driver::factory()->count(2)->create([
            'status' => 'active',
            'sex' => 'male',
        ]);

        Driver::factory()->count(2)->create([
            'status' => 'inactive',
            'sex' => 'female',
        ]);

        $service = new DriverMetricsService;

        $metrics = $service->metrics(null, null, 'Inactive');

        $this->assertSame(2, $metrics['total']);
        $this->assertSame(0, $metrics['active']);
        $this->assertSame(2, $metrics['inactive']);
        $this->assertSame(0, $metrics['male']);
        $this->assertSame(2, $metrics['female']);
    }
}
