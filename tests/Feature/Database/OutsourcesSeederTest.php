<?php

namespace Tests\Feature\Database;

use App\Models\Outsource;
use Database\Seeders\OutsourcesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class OutsourcesSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_outsources_from_legacy_dataset(): void
    {
        Outsource::factory()->create([
            'name' => 'Legacy Placeholder Outsource',
        ]);

        $this->seed(OutsourcesSeeder::class);

        $dataset = collect(json_decode(
            File::get(database_path('seeders/data/legacy_outsources.json')),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        $outsources = Outsource::withTrashed()->orderBy('id')->get();

        $this->assertCount($dataset->count(), $outsources);
        $this->assertFalse(Outsource::where('name', 'Legacy Placeholder Outsource')->exists());

        $firstOutsource = $outsources->firstWhere('id', 1);
        $this->assertNotNull($firstOutsource);
        $this->assertSame('Million Transport', $firstOutsource->name);
        $this->assertSame('12', $firstOutsource->phone);
        $this->assertSame('active', $firstOutsource->status);
        $this->assertNull($firstOutsource->service_type);
        $this->assertSame('Natherath'.PHP_EOL.'Office: 12'.PHP_EOL.'Remark: made by yetim', $firstOutsource->address);
    }
}
