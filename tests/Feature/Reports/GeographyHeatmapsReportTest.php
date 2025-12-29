<?php

namespace Tests\Feature\Reports;

use App\Models\Operation;
use App\Models\Performance;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class GeographyHeatmapsReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_geography_heatmaps_report_displays_geographic_rows(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->grantPermissions($user, 'reports.geography-heatmaps.view');

        $origin = Place::factory()->create(['name' => 'Addis Hub']);
        $destination = Place::factory()->create();
        $operation = Operation::factory()->create(['tariff' => 250]);

        Performance::factory()->for($operation)
            ->state([
                'orgion_id' => $origin->id,
                'destination_id' => $destination->id,
                'CargoVolumMT' => 18.5,
                'DateDispach' => now()->subDays(3),
            ])
            ->create();

        $response = $this->actingAs($user)->get(route('reports.geography-heatmaps', [
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
        ]));

        $response->assertOk()
            ->assertInertia(function (AssertableInertia $page) {
                $page->component('Reports/GeographyHeatmaps')
                    ->has('regions', 1)
                    ->has('filters')
                    ->where('regions.0.trips', 1)
                    ->where('regions.0.revenue', fn ($value) => $value > 0)
                    ->etc();
            });
    }

    public function test_geography_heatmaps_csv_export_succeeds(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->grantPermissions($user, 'reports.geography-heatmaps.view', 'reports.geography-heatmaps.export');

        $origin = Place::factory()->create();
        $destination = Place::factory()->create();
        $operation = Operation::factory()->create(['tariff' => 300]);

        Performance::factory()->for($operation)
            ->state([
                'orgion_id' => $origin->id,
                'destination_id' => $destination->id,
                'CargoVolumMT' => 12,
                'DateDispach' => now()->subDay(),
            ])
            ->create();

        $response = $this->actingAs($user)->get(route('reports.geography-heatmaps.export', [
            'format' => 'csv',
            'from' => now()->subWeek()->toDateString(),
            'to' => now()->toDateString(),
        ]));

        $response->assertOk();
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));
        $this->assertNotNull($response->headers->get('content-disposition'));
    }

    private function grantPermissions(User $user, string ...$permissions): void
    {
        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $user->givePermissionTo($permissions);
    }
}
