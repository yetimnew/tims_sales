<?php

namespace Tests\Feature\Database;

use App\Enums\CargoServiceType;
use App\Enums\OperationDestinationScope;
use App\Models\CargoType;
use App\Models\Customer;
use App\Models\Operation;
use App\Models\Region;
use App\Models\User;
use Database\Seeders\CargoTypesSeeder;
use Database\Seeders\CustomersSeeder;
use Database\Seeders\EthiopiaRegionsSeeder;
use Database\Seeders\OperationsSeeder;
use Database\Seeders\UsersSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class OperationsSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_operations_from_legacy_dataset(): void
    {
        $this->seed(UsersSeeder::class);
        $this->seed(CustomersSeeder::class);
        $this->seed(EthiopiaRegionsSeeder::class);
        $this->seed(CargoTypesSeeder::class);

        $customer = Customer::firstOrFail();
        $user = User::firstOrFail();
        $region = Region::firstOrFail();
        $cargoType = CargoType::firstOrFail();

        Operation::create([
            'operationid' => 'PLACEHOLDER',
            'customer_id' => $customer->getKey(),
            'startdate' => now()->toDateString(),
            'destination_scope' => OperationDestinationScope::Region->value,
            'destination_name' => $region->name,
            'destination_reference_type' => $region::class,
            'destination_reference_id' => $region->getKey(),
            'volume' => '1.00',
            'cargo_type_id' => $cargoType->getKey(),
            'cargo_service_type' => CargoServiceType::Commercial->value,
            'km' => '1.00',
            'tariff' => '1.00',
            'status' => 'active',
            'closed' => false,
            'user_id' => $user->getKey(),
        ]);

        $this->seed(OperationsSeeder::class);

        $dataset = collect(json_decode(
            File::get(database_path('seeders/data/legacy_operations.json')),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        $operations = Operation::withTrashed()->orderBy('id')->get();

        $this->assertCount($dataset->count(), $operations);
        $this->assertFalse(Operation::where('operationid', 'PLACEHOLDER')->exists());

        $firstOperation = $operations->firstWhere('id', 6);
        $this->assertNotNull($firstOperation);
        $this->assertSame('082/12', $firstOperation->operationid);
        $this->assertSame('active', $firstOperation->status);
        $this->assertFalse($firstOperation->closed);
        $this->assertSame(CargoServiceType::Commercial, $firstOperation->cargo_service_type);
        $this->assertSame('Commercial Cargo', $firstOperation->cargoType->name);
        $this->assertSame(OperationDestinationScope::Region, $firstOperation->destination_scope);
        $this->assertSame('Cental', $firstOperation->destination_name);
        $this->assertSame('2020-03-03', $firstOperation->startdate?->toDateString());
        $this->assertSame('254781.00', $firstOperation->km);

        $reliefOperation = $operations->firstWhere('id', 12);
        $this->assertNotNull($reliefOperation);
        $this->assertSame(CargoServiceType::Relief, $reliefOperation->cargo_service_type);
        $this->assertSame('Relief Cargo', $reliefOperation->cargoType->name);

        $closedOperation = $operations->firstWhere('id', 20);
        $this->assertNotNull($closedOperation);
        $this->assertTrue($closedOperation->closed);
        $this->assertSame('OROMIA', $closedOperation->destination_name);
    }
}
