<?php

namespace Tests\Feature\OutsourcePerformance;

use App\Models\OutsourcePerformance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OutsourcePerformanceAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_limits_index_results_to_owned_outsource_performances_when_only_view_own_permission_is_granted(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, [
            'outsource-performances.view',
            'outsource-performances.view-own',
            'outsource-performances.show',
        ]);

        $ownPerformance = OutsourcePerformance::factory()->for($user)->create();
        OutsourcePerformance::factory()->create();

        $this->actingAs($user)
            ->get(route('outsource-performances.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('OutsourcePerformances/Index')
                ->has('outsourcePerformances.data', 1)
                ->where('outsourcePerformances.data.0.id', $ownPerformance->id)
                ->where('can.viewOthers', false)
            );
    }

    #[Test]
    public function it_forbids_viewing_other_outsource_performances_when_only_view_own_permission_is_granted(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, [
            'outsource-performances.view',
            'outsource-performances.view-own',
            'outsource-performances.show',
        ]);

        $otherPerformance = OutsourcePerformance::factory()->create();

        $this->actingAs($user)
            ->get(route('outsource-performances.show', $otherPerformance))
            ->assertForbidden();
    }
}
