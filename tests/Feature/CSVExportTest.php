<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CSVExportTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    #[Test]
    public function trucks_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/trucks/export/csv');

        $response->assertNotFound();
    }

    #[Test]
    public function drivers_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/drivers/export/csv');

        $response->assertNotFound();
    }

    #[Test]
    public function maintenance_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/maintenance/export/csv');

        $response->assertNotFound();
    }

    #[Test]
    public function maintenance_types_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/maintenance-types/export/csv');

        $response->assertNotFound();
    }

    #[Test]
    public function fuel_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/fuel/export/csv');

        $response->assertNotFound();
    }

    #[Test]
    public function customers_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/customers/export/csv');

        $response->assertNotFound();
    }

    #[Test]
    public function distances_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/distances/export');

        $response->assertNotFound();
    }

    #[Test]
    public function financial_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/financial/export/csv');

        $response->assertNotFound();
    }

    #[Test]
    public function operations_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/operations/export/csv');

        $response->assertNotFound();
    }

    #[Test]
    public function vehicle_types_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/vehicletypes/export/csv');

        $response->assertNotFound();
    }

    #[Test]
    public function performances_export_route_is_unavailable(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/performances/export/csv');

        $response->assertNotFound();
    }
}
