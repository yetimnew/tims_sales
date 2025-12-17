<?php

namespace Tests\Unit\Services\Statuses;

use App\Models\Status;
use App\Models\StatusType;
use App\Services\Statuses\StatusIndexService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class StatusIndexServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_index_result(): void
    {
        $operational = StatusType::factory()->create(['name' => 'Operational']);
        $maintenance = StatusType::factory()->create(['name' => 'Maintenance']);

        Status::factory()->create([
            'statustype_id' => $operational->id,
            'name' => 'Active',
            'description' => 'Primary operational status',
        ]);

        Status::factory()->create([
            'statustype_id' => $operational->id,
            'name' => 'Idle',
        ]);

        Status::factory()->create([
            'statustype_id' => $maintenance->id,
            'name' => 'Repair',
        ]);

        $service = app(StatusIndexService::class);
        $request = Request::create('/statuses', 'GET');

        $result = $service->getIndexResult($request);

        $this->assertCount(3, $result->statuses['data']);
        $this->assertSame(3, $result->metrics['total']);
        $this->assertSame(2, $result->metrics['unique_types']);

        $optionIds = array_column($result->statusTypeOptions, 'id');
        $this->assertEqualsCanonicalizing([$operational->id, $maintenance->id], $optionIds);
    }

    public function test_it_applies_filters(): void
    {
        $operational = StatusType::factory()->create(['name' => 'Operational']);
        $maintenance = StatusType::factory()->create(['name' => 'Maintenance']);

        Status::factory()->create([
            'statustype_id' => $operational->id,
            'name' => 'Loading',
        ]);

        Status::factory()->create([
            'statustype_id' => $operational->id,
            'name' => 'Idle',
        ]);

        Status::factory()->create([
            'statustype_id' => $maintenance->id,
            'name' => 'Maintenance Hold',
        ]);

        $service = app(StatusIndexService::class);
        $request = Request::create('/statuses', 'GET', [
            'search' => 'Maintenance',
            'statustype_id' => $maintenance->id,
        ]);

        $result = $service->getIndexResult($request);

        $this->assertCount(1, $result->statuses['data']);
        $status = $result->statuses['data'][0];

        $this->assertSame('Maintenance Hold', $status['name']);
        $this->assertSame($maintenance->id, $status['statustype_id']);
    }
}
