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
            'cargotypes.store',
            'cargotypes.update',
            'cargotypes.destroy',
        ]);
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
