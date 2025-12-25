<?php

namespace Tests\Feature;

use App\Models\Performance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get(route('dashboard'))->assertOk();
    }

    public function test_status_breakdown_groups_recent_performances(): void
    {
        Carbon::setTestNow($now = now()->startOfDay());

        try {
            $user = User::factory()->create();

            Performance::factory()->create([
                'DateDispach' => $now->copy()->subDays(5),
                'returned_date' => $now->copy()->subDays(3),
                'is_returned' => true,
                'satus' => 'completed',
                'load_phase' => 'main',
            ]);

            Performance::factory()->create([
                'DateDispach' => $now->copy()->subDays(3),
                'is_returned' => false,
                'satus' => 'active',
                'load_phase' => 'main',
            ]);

            Performance::factory()->create([
                'DateDispach' => $now->copy()->subDays(10),
                'is_returned' => false,
                'satus' => 'active',
                'load_phase' => 'return',
            ]);

            Performance::factory()->create([
                'DateDispach' => $now->copy()->subDays(18),
                'is_returned' => false,
                'satus' => 'active',
                'load_phase' => 'return',
            ]);

            Performance::factory()->create([
                'DateDispach' => $now->copy()->subDays(2),
                'is_returned' => false,
                'satus' => 'cancelled',
                'load_phase' => null,
            ]);

            Performance::factory()->create([
                'DateDispach' => $now->copy()->subDays(6),
                'is_returned' => false,
                'satus' => 'failed',
                'load_phase' => 'main',
            ]);

            $response = $this->actingAs($user)->get(route('dashboard'));

            $response->assertStatus(200)
                ->assertInertia(function (AssertableInertia $page) {
                    return $page
                        ->component('Dashboard')
                        ->where('networkOverview.statusBreakdown', function (array $breakdown): bool {
                            $byStatus = collect($breakdown)->keyBy('status');

                            $expectedCounts = [
                                'completed' => 1,
                                'in_transit' => 1,
                                'awaiting_return' => 1,
                                'overdue' => 1,
                                'cancelled' => 1,
                                'failed' => 1,
                            ];

                            foreach ($expectedCounts as $status => $count) {
                                if (! isset($byStatus[$status])) {
                                    return false;
                                }

                                if (($byStatus[$status]['count'] ?? null) !== $count) {
                                    return false;
                                }

                                if (! array_key_exists('share', $byStatus[$status])) {
                                    return false;
                                }

                                if (! array_key_exists('color', $byStatus[$status])) {
                                    return false;
                                }
                            }

                            $totalCount = array_sum($expectedCounts);

                            foreach ($expectedCounts as $status => $count) {
                                $expectedShare = $totalCount > 0 ? round(($count / $totalCount) * 100, 1) : 0.0;
                                if (abs(($byStatus[$status]['share'] ?? 0.0) - $expectedShare) > 0.1) {
                                    return false;
                                }
                            }

                            return true;
                        })
                        ->where('networkOverview.loadPhaseBreakdown', function (array $breakdown): bool {
                            $byPhase = collect($breakdown)->keyBy('phase');

                            $expectedCounts = [
                                'main' => 3,
                                'return' => 2,
                                'unspecified' => 1,
                            ];

                            foreach ($expectedCounts as $phase => $count) {
                                if (! isset($byPhase[$phase])) {
                                    return false;
                                }

                                if (($byPhase[$phase]['count'] ?? null) !== $count) {
                                    return false;
                                }

                                if (! array_key_exists('share', $byPhase[$phase])) {
                                    return false;
                                }

                                if (! array_key_exists('color', $byPhase[$phase])) {
                                    return false;
                                }
                            }

                            $totalCount = array_sum($expectedCounts);

                            foreach ($expectedCounts as $phase => $count) {
                                $expectedShare = $totalCount > 0 ? round(($count / $totalCount) * 100, 1) : 0.0;
                                if (abs(($byPhase[$phase]['share'] ?? 0.0) - $expectedShare) > 0.1) {
                                    return false;
                                }
                            }

                            return true;
                        })
                        ->etc();
                });
        } finally {
            Carbon::setTestNow();
        }
    }
}
