<?php

namespace Tests\Feature\Performance;

use App\Models\Performance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PerformanceAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_limits_index_results_to_owned_performances_when_only_view_own_permission_is_granted(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, [
            'performances.view',
            'performances.view-own',
            'performances.show',
        ]);

        $ownPerformance = Performance::factory()->for($user)->create();
        Performance::factory()->create();

        $this->actingAs($user)
            ->get(route('performances.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Performances/Index')
                ->has('performances.data', 1)
                ->where('performances.data.0.id', $ownPerformance->id)
                ->where('can.viewOthers', false)
            );
    }

    #[Test]
    public function it_forbids_viewing_other_users_performances_when_only_view_own_permission_is_granted(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, [
            'performances.view',
            'performances.view-own',
            'performances.show',
        ]);

        $otherPerformance = Performance::factory()->create();

        $this->actingAs($user)
            ->get(route('performances.show', $otherPerformance))
            ->assertForbidden();
    }
}
