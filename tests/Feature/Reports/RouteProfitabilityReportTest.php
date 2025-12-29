<?php

namespace Tests\Feature\Reports;

use App\Models\Customer;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class RouteProfitabilityReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_route_profitability_report_displays_rows_and_summary(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->grantPermissions($user, 'reports.route-profitability.view');

        $customer = Customer::factory()->create(['name' => 'Atlas Logistics']);
        $operation = Operation::factory()
            ->for($customer)
            ->state([
                'tariff' => 150.0,
                'status' => 'active',
            ])
            ->create();

        $origin = Place::factory()->create(['name' => 'Addis Ababa']);
        $destination = Place::factory()->create(['name' => 'Dire Dawa']);

        Performance::factory()
            ->for($operation)
            ->state([
                'DateDispach' => now()->subDay(),
                'orgion_id' => $origin->id,
                'destination_id' => $destination->id,
                'CargoVolumMT' => 20.0,
                'tonkm' => 250.0,
                'DistanceWCargo' => 300.0,
                'DistanceWOCargo' => 40.0,
                'fuelInBirr' => 4000.0,
                'perdiem' => 800.0,
                'workOnGoing' => 200.0,
                'other' => 150.0,
            ])
            ->create();

        $response = $this->actingAs($user)->get(route('reports.route-profitability', [
            'from' => now()->subDays(2)->toDateString(),
            'to' => now()->toDateString(),
        ]));

        $props = [];

        $response->assertOk()
            ->assertInertia(function (AssertableInertia $page) use (&$props) {
                $page->component('Reports/RouteProfitability')
                    ->has('rows', 1)
                    ->has('summary', fn (AssertableInertia $summary) => $summary
                        ->where('total_routes', 1)
                        ->where('total_trips', 1)
                        ->where('total_revenue', fn ($value) => $value > 0)
                        ->where('total_profit', fn ($value) => $value > 0)
                        ->etc()
                    )
                    ->has('options.places')
                    ->has('options.customers')
                    ->has('options.sorts');

                $props = $page->toArray()['props'];
            });

        $payload = $props;

        $expectedRevenue = 250.0 * 150.0;
        $expectedExpense = 4000.0 + 800.0 + 200.0 + 150.0;
        $expectedProfit = $expectedRevenue - $expectedExpense;

        $this->assertNotEmpty($payload['rows']);
        $this->assertSame('Addis Ababa', $payload['rows'][0]['origin_name']);
        $this->assertSame('Dire Dawa', $payload['rows'][0]['destination_name']);
        $this->assertEqualsWithDelta($expectedRevenue, $payload['rows'][0]['revenue'], 0.01);
        $this->assertEqualsWithDelta($expectedProfit, $payload['rows'][0]['profit'], 0.01);
        $this->assertEqualsWithDelta($expectedProfit, $payload['summary']['total_profit'], 0.01);
    }

    public function test_route_profitability_report_csv_export_succeeds(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->grantPermissions($user, 'reports.route-profitability.view', 'reports.route-profitability.export');

        $customer = Customer::factory()->create();
        $operation = Operation::factory()->for($customer)->state(['tariff' => 95.0])->create();
        $origin = Place::factory()->create();
        $destination = Place::factory()->create();

        Performance::factory()
            ->for($operation)
            ->state([
                'DateDispach' => now(),
                'orgion_id' => $origin->id,
                'destination_id' => $destination->id,
                'tonkm' => 150.0,
                'CargoVolumMT' => 15.0,
                'DistanceWCargo' => 200.0,
                'DistanceWOCargo' => 25.0,
                'fuelInBirr' => 1000.0,
                'perdiem' => 250.0,
                'workOnGoing' => 150.0,
                'other' => 75.0,
            ])
            ->create();

        $response = $this->actingAs($user)->get(route('reports.route-profitability.export', [
            'format' => 'csv',
            'from' => now()->subDay()->toDateString(),
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
