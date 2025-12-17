<?php

namespace Tests\Feature\StatusTypes;

use App\Models\Status;
use App\Models\StatusType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class StatusTypeIndexTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        Permission::create([
            'name' => 'statustypes.view',
            'guard_name' => 'web',
        ]);

        $this->user->givePermissionTo('statustypes.view');
    }

    #[Test]
    public function it_displays_status_types_with_metrics(): void
    {
        $inUse = StatusType::factory()->create(['name' => 'Operational']);
        $unused = StatusType::factory()->create(['name' => 'Archived']);

        Status::factory()->create([
            'statustype_id' => $inUse->id,
            'name' => 'Available',
        ]);

        Status::factory()->create([
            'statustype_id' => $inUse->id,
            'name' => 'Maintenance',
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('statustypes.index'));

        $response->assertStatus(200)
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('StatusTypes/Index')
                ->has('statusTypes.data', 2)
                ->where('statusTypes.data.0.id', fn ($value) => in_array($value, [$inUse->id, $unused->id], true))
                ->where('statusTypes.meta.total', 2)
                ->where('statusTypes.data', fn ($items) => collect($items)
                    ->contains(fn (array $item) => $item['id'] === $inUse->id
                        && count($item['statuses']) === 2
                        && collect($item['statuses'])->pluck('name')->sort()->values()->all() === ['Available', 'Maintenance'])
                )
                ->where('metrics.total', 2)
                ->where('metrics.in_use', 1)
                ->where('metrics.unused', 1)
                ->where('metrics.statuses_total', 2)
                ->where('usageOptions.0.value', 'all')
                ->where('perPageOptions', [15, 25, 50, 100])
            );
    }

    #[Test]
    public function it_filters_status_types_by_usage(): void
    {
        $inUse = StatusType::factory()->create(['name' => 'Active']);
        Status::factory()->create([
            'statustype_id' => $inUse->id,
        ]);

        $unused = StatusType::factory()->create(['name' => 'Spare']);

        $response = $this->actingAs($this->user)
            ->get(route('statustypes.index', ['usage' => 'in_use']));

        $response->assertStatus(200)
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('StatusTypes/Index')
                ->has('statusTypes.data', 1)
                ->where('statusTypes.data.0.id', $inUse->id)
                ->where('filters.usage', 'in_use')
                ->where('statusTypes.data.0.statuses', fn ($value) => is_iterable($value))
            );

        $this->assertDatabaseHas('statustypes', ['id' => $unused->id]);
    }
}
