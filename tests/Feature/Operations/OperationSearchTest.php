<?php

namespace Tests\Feature\Operations;

use App\Models\Customer;
use App\Models\Operation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OperationSearchTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_returns_matching_operations_and_selected_entries(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['operations.view']);

        $customer = Customer::factory()->create(['name' => 'Remote Logistics']);

        $primary = Operation::factory()
            ->for($customer)
            ->create([
                'operationid' => 'OP-AAA-REMOTE',
                'remark' => 'Remote search primary',
            ]);

        Operation::factory()
            ->for($customer)
            ->create([
                'operationid' => 'OP-BBB-REMOTE',
                'remark' => 'Remote search secondary',
            ]);

        $selected = Operation::factory()->create([
            'operationid' => 'OP-SELECTED',
        ]);

        $response = $this->actingAs($user)
            ->getJson(route('operations.search', [
                'search' => 'REMOTE',
                'limit' => 1,
                'selected' => [$selected->id],
            ]));

        $response->assertOk();

        $response->assertJson(fn (AssertableJson $json) => $json
            ->where('has_more', true)
            ->has('data', 2)
            ->has('data.0', fn (AssertableJson $item) => $item
                ->where('id', $primary->id)
                ->where('operationid', $primary->operationid)
                ->has('customer', fn (AssertableJson $customerJson) => $customerJson
                    ->where('id', $customer->id)
                    ->where('name', $customer->name)
                )
            )
            ->has('data.1', fn (AssertableJson $item) => $item
                ->where('id', $selected->id)
                ->where('operationid', $selected->operationid)
                ->has('customer')
            )
        );
    }
}
