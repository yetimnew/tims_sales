<?php

namespace Tests\Feature\Reports;

use App\Models\Customer;
use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Place;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class PerformanceAllReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_performance_all_report_displays_rows_summary_and_highlights(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $driver = Driver::factory()->state(['status' => 'active'])->create(['name' => 'Alex Rider']);
        $truck = Truck::factory()->state(['status' => 'active'])->create(['plate' => 'AB-1234']);
        $driverTruck = DriverTruck::factory()
            ->for($driver)
            ->for($truck)
            ->state(['status' => 'active'])
            ->create();

        $origin = Place::factory()->create(['status' => 'active', 'name' => 'Addis Ababa']);
        $destination = Place::factory()->create(['status' => 'active', 'name' => 'Dire Dawa']);

        $customer = Customer::factory()->create(['name' => 'Acme Logistics']);
        $operation = Operation::factory()
            ->for($customer)
            ->state([
                'operationid' => 'OP-001',
                'tariff' => 120.5,
                'status' => 'active',
            ])
            ->create();

        Performance::factory()->state([
            'driver_truck_id' => $driverTruck->id,
            'operation_id' => $operation->id,
            'DateDispach' => now()->subDays(2),
            'orgion_id' => $origin->id,
            'destination_id' => $destination->id,
            'FOnumber' => 'FO-1001',
            'CargoVolumMT' => 12.5,
            'tonkm' => 180.0,
            'DistanceWCargo' => 300.0,
            'DistanceWOCargo' => 40.0,
            'fuelInLitter' => 150.0,
            'fuelInBirr' => 5000.0,
            'perdiem' => 800.0,
            'workOnGoing' => 200.0,
            'other' => 150.0,
            'satus' => 'completed',
        ])->create();

        $response = $this->actingAs($user)->get(route('reports.performance-all', [
            'from' => now()->subDays(7)->toDateString(),
            'to' => now()->toDateString(),
        ]));

        $props = [];

        $response->assertOk()
            ->assertInertia(function (AssertableInertia $page) use (&$props) {
                $page->component('Reports/PerformanceAll')
                    ->has('rows', 1)
                    ->has('summary', fn (AssertableInertia $summary) => $summary
                        ->where('records', 1)
                        ->where('revenue', fn ($value) => $value > 0)
                        ->etc()
                    )
                    ->has('highlights.top_drivers', 1)
                    ->has('options.drivers')
                    ->has('options.trucks');

                $props = $page->toArray()['props'];
            });

        $payload = $props;

        $this->assertNotEmpty($payload['rows']);
        $this->assertSame('FO-1001', $payload['rows'][0]['fo_number']);
        $this->assertSame('Alex Rider', $payload['rows'][0]['driver_name']);

        $expectedRevenue = 180.0 * 120.5;
        $expectedExpense = 5000.0 + 800.0 + 200.0 + 150.0;
        $expectedProfit = $expectedRevenue - $expectedExpense;

        $this->assertEqualsWithDelta($expectedRevenue, $payload['summary']['revenue'], 0.01);
        $this->assertEqualsWithDelta($expectedExpense, $payload['summary']['expense'], 0.01);
        $this->assertEqualsWithDelta($expectedProfit, $payload['summary']['profit'], 0.01);
    }

    public function test_performance_all_report_csv_export_succeeds(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $driverTruck = DriverTruck::factory()->create();
        $operation = Operation::factory()->create(['tariff' => 100]);
        $origin = Place::factory()->create();
        $destination = Place::factory()->create();

        Performance::factory()->state([
            'driver_truck_id' => $driverTruck->id,
            'operation_id' => $operation->id,
            'DateDispach' => now(),
            'orgion_id' => $origin->id,
            'destination_id' => $destination->id,
            'workOnGoing' => 0,
            'other' => 0,
            'fuelInBirr' => 0,
            'perdiem' => 0,
        ])->create();

        $response = $this->actingAs($user)->get(route('reports.performance-all.export', ['format' => 'csv', 'from' => now()->subDay()->toDateString(), 'to' => now()->toDateString()]));

        $response->assertOk();
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));
        $this->assertNotNull($response->headers->get('content-disposition'));
    }
}
