<?php

namespace Tests\Feature;

use App\Enums\CargoCategory;
use App\Events\CargoTypeCreated;
use App\Events\CargoTypeDeleted;
use App\Events\CargoTypeUpdated;
use App\Models\CargoType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CargoTypeControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'cargotypes.view',
            'cargotypes.store',
            'cargotypes.update',
            'cargotypes.destroy',
        ]);
    }

    #[Test]
    public function it_lists_cargo_types_newest_first(): void
    {
        $olderType = CargoType::factory()->create(['created_at' => now()->subDays(5)]);
        $newerType = CargoType::factory()->create(['created_at' => now()->subDays(2)]);
        $latestType = CargoType::factory()->create(['created_at' => now()]);

        $response = $this->actingAs($this->user)
            ->get(route('cargo-types.index'));

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('CargoTypes/Index')
                ->has('cargoTypes.data', 3)
                ->where('cargoTypes.data.0.id', $latestType->id)
                ->where('cargoTypes.data.1.id', $newerType->id)
                ->where('cargoTypes.data.2.id', $olderType->id)
            );
    }

    #[Test]
    public function it_dispatches_event_when_cargo_type_is_created(): void
    {
        Event::fake([
            CargoTypeCreated::class,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('cargo-types.store'), [
                'name' => 'Bulk Cement',
                'category' => CargoCategory::Construction->value,
                'requires_special_equipment' => true,
            ]);

        $response->assertRedirect(route('cargo-types.index'));
        $response->assertSessionHas('success', 'Cargo type created successfully.');

        Event::assertDispatched(CargoTypeCreated::class, function (CargoTypeCreated $event): bool {
            return $event->cargoType->name === 'Bulk Cement';
        });
    }

    #[Test]
    public function it_dispatches_event_when_cargo_type_is_updated(): void
    {
        Event::fake([
            CargoTypeUpdated::class,
        ]);

        $cargoType = CargoType::factory()->create([
            'name' => 'Perishables',
            'category' => CargoCategory::Food->value,
            'requires_special_equipment' => false,
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('cargo-types.update', $cargoType), [
                'name' => 'Perishables Fresh',
                'category' => CargoCategory::Food->value,
                'requires_special_equipment' => true,
            ]);

        $response->assertRedirect(route('cargo-types.index'));
        $response->assertSessionHas('success', 'Cargo type updated successfully.');

        Event::assertDispatched(CargoTypeUpdated::class, function (CargoTypeUpdated $event): bool {
            return $event->changes['requires_special_equipment']['new'] === true;
        });
    }

    #[Test]
    public function it_validates_unique_name_when_updating(): void
    {
        $existing = CargoType::factory()->create(['name' => 'Aggregates']);
        $cargoType = CargoType::factory()->create([
            'name' => 'Bulk Cement',
            'requires_special_equipment' => false,
            'category' => CargoCategory::Construction->value,
        ]);

        $response = $this->actingAs($this->user)
            ->from(route('cargo-types.edit', $cargoType))
            ->put(route('cargo-types.update', $cargoType), [
                'name' => $existing->name,
                'category' => $cargoType->category instanceof CargoCategory
                    ? $cargoType->category->value
                    : $cargoType->category,
                'requires_special_equipment' => $cargoType->requires_special_equipment,
            ]);

        $response->assertSessionHasErrors('name');
        $this->assertDatabaseHas('cargo_types', [
            'id' => $cargoType->id,
            'name' => 'Bulk Cement',
        ]);
    }

    #[Test]
    public function it_dispatches_event_when_cargo_type_is_deleted(): void
    {
        Event::fake([
            CargoTypeDeleted::class,
        ]);

        $cargoType = CargoType::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('cargo-types.destroy', $cargoType));

        $response->assertRedirect(route('cargo-types.index'));
        $response->assertSessionHas('success', 'Cargo type deleted successfully.');

        Event::assertDispatched(CargoTypeDeleted::class, function (CargoTypeDeleted $event) use ($cargoType): bool {
            return $event->cargoTypeId === $cargoType->id;
        });
    }
}
