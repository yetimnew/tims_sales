<?php

namespace Tests\Feature\Database;

use App\Models\Customer;
use Database\Seeders\CustomersSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class CustomersSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_customers_from_legacy_dataset(): void
    {
        $placeholder = Customer::factory()->create([
            'name' => 'Placeholder Legacy Customer',
        ]);

        $this->seed(CustomersSeeder::class);

        $dataset = collect(json_decode(
            File::get(database_path('seeders/data/legacy_customers.json')),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        $customers = Customer::withTrashed()->orderBy('id')->get();

        $this->assertCount($dataset->count(), $customers);
        $this->assertFalse(Customer::where('name', 'Placeholder Legacy Customer')->exists());

        $firstCustomer = $customers->firstWhere('id', 1);
        $this->assertNotNull($firstCustomer);
        $this->assertSame('DPPA', $firstCustomer->name);
        $this->assertSame('active', $firstCustomer->status);
        $this->assertNotNull($firstCustomer->address);
        $this->assertStringContainsString('Office: 121212121', (string) $firstCustomer->address);
        $this->assertNull($firstCustomer->contact_person);

        $amharicCustomer = $customers->firstWhere('id', 5);
        $this->assertNotNull($amharicCustomer);
        $this->assertSame('ኑርሁሴን አደም የጅምላ አህል ንግድ', $amharicCustomer->name);
        $this->assertSame('0911242862', $amharicCustomer->phone);
    }
}
