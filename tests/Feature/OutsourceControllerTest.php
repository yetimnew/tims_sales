<?php

namespace Tests\Feature;

use App\Events\OutsourceCreated;
use App\Events\OutsourceDeleted;
use App\Events\OutsourceUpdated;
use App\Models\Outsource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OutsourceControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'outsources.store',
            'outsources.update',
            'outsources.destroy',
        ]);
    }

    #[Test]
    public function it_dispatches_event_when_outsource_is_created(): void
    {
        Event::fake([
            OutsourceCreated::class,
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('outsources.store'), [
                'name' => 'Acme Logistics',
                'contact_person' => 'Jane Doe',
                'phone' => '+251 911 000 000',
                'email' => 'acme@example.com',
                'address' => 'Addis Ababa, Ethiopia',
                'service_type' => 'Long Haul',
                'status' => 'active',
            ]);

        $response->assertRedirect(route('outsources.index'));
        $response->assertSessionHas('success', 'Outsource created successfully.');

        Event::assertDispatched(OutsourceCreated::class, function (OutsourceCreated $event): bool {
            return $event->outsource->name === 'Acme Logistics';
        });
    }

    #[Test]
    public function it_dispatches_event_when_outsource_is_updated(): void
    {
        Event::fake([
            OutsourceUpdated::class,
        ]);

        $outsource = Outsource::factory()->create([
            'contact_person' => 'John Doe',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('outsources.update', $outsource), [
                'name' => $outsource->name,
                'contact_person' => 'Jane Smith',
                'phone' => $outsource->phone,
                'email' => $outsource->email,
                'address' => $outsource->address,
                'service_type' => $outsource->service_type,
                'status' => 'active',
            ]);

        $response->assertRedirect(route('outsources.index'));
        $response->assertSessionHas('success', 'Outsource updated successfully.');

        Event::assertDispatched(OutsourceUpdated::class, function (OutsourceUpdated $event): bool {
            return $event->changes['contact_person']['new'] === 'Jane Smith';
        });
    }

    #[Test]
    public function it_dispatches_event_when_outsource_is_deleted(): void
    {
        Event::fake([
            OutsourceDeleted::class,
        ]);

        $outsource = Outsource::factory()->create([
            'status' => 'inactive',
        ]);

        $response = $this->actingAs($this->user)
            ->delete(route('outsources.destroy', $outsource));

        $response->assertRedirect(route('outsources.index'));
        $response->assertSessionHas('success', 'Outsource deleted successfully.');

        Event::assertDispatched(OutsourceDeleted::class, function (OutsourceDeleted $event) use ($outsource): bool {
            return $event->outsourceId === $outsource->id;
        });
    }
}
