<?php

namespace Tests\Feature\Settings;

use App\Jobs\RecalculateTruckGradeSnapshots;
use App\Models\TruckGradingSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class TruckGradingSettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_weights_route_updates_weights_and_peer_sample_size_when_valid(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['trucks.update']);

        Bus::fake();

        $response = $this->actingAs($user)
            ->from(route('settings.truck-grading.edit'))
            ->patch(route('settings.truck-grading.weights.update'), [
                'utilization_weight' => 40,
                'efficiency_weight' => 20,
                'reliability_weight' => 15,
                'financial_weight' => 15,
                'compliance_weight' => 10,
                'peer_sample_size' => 12,
            ]);

        $response
            ->assertRedirect(route('settings.truck-grading.edit'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Truck grading weights updated. Snapshot recalculation queued.');

        Bus::assertDispatched(RecalculateTruckGradeSnapshots::class);

        $setting = TruckGradingSetting::query()->latest('updated_at')->first();

        $this->assertNotNull($setting);
        $this->assertSame(40, $setting->utilization_weight);
        $this->assertSame(20, $setting->efficiency_weight);
        $this->assertSame(15, $setting->reliability_weight);
        $this->assertSame(15, $setting->financial_weight);
        $this->assertSame(10, $setting->compliance_weight);
        $this->assertSame(12, $setting->peer_sample_size);
        $this->assertSame($user->id, $setting->updated_by);
        $this->assertSame(TruckGradingSetting::defaultGradeThresholds(), $setting->grade_thresholds);
    }

    public function test_weights_route_requires_weights_to_total_one_hundred(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['trucks.update']);

        Bus::fake();

        $response = $this->actingAs($user)
            ->from(route('settings.truck-grading.edit'))
            ->patch(route('settings.truck-grading.weights.update'), [
                'utilization_weight' => 30,
                'efficiency_weight' => 20,
                'reliability_weight' => 15,
                'financial_weight' => 15,
                'compliance_weight' => 10,
                'peer_sample_size' => 12,
            ]);

        $response
            ->assertRedirect(route('settings.truck-grading.edit'))
            ->assertSessionHasErrors(['weights']);

        $this->assertDatabaseCount('truck_grading_settings', 0);
        Bus::assertNotDispatched(RecalculateTruckGradeSnapshots::class);
    }

    public function test_grade_threshold_route_updates_thresholds_when_valid(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['trucks.update']);

        Bus::fake();

        $response = $this->actingAs($user)
            ->from(route('settings.truck-grading.edit'))
            ->patch(route('settings.truck-grading.grade-thresholds.update'), [
                'grade_thresholds' => [
                    'A' => 95,
                    'B' => 85,
                    'C' => 70,
                    'D' => 60,
                    'E' => 0,
                ],
            ]);

        $response
            ->assertRedirect(route('settings.truck-grading.edit'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Truck grading grade thresholds updated. Snapshot recalculation queued.');

        Bus::assertDispatched(RecalculateTruckGradeSnapshots::class);

        $setting = TruckGradingSetting::query()->latest('updated_at')->first();

        $this->assertNotNull($setting);
        $this->assertSame($user->id, $setting->updated_by);
        $this->assertSame(
            TruckGradingSetting::normalizeGradeThresholds([
                'A' => 95,
                'B' => 85,
                'C' => 70,
                'D' => 60,
                'E' => 0,
            ]),
            TruckGradingSetting::normalizeGradeThresholds($setting->grade_thresholds),
        );
    }

    public function test_grade_threshold_route_rejects_invalid_threshold_sequence(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['trucks.update']);

        Bus::fake();

        $response = $this->actingAs($user)
            ->from(route('settings.truck-grading.edit'))
            ->patch(route('settings.truck-grading.grade-thresholds.update'), [
                'grade_thresholds' => [
                    'A' => 80,
                    'B' => 85,
                    'C' => 70,
                    'D' => 60,
                    'E' => 5,
                ],
            ]);

        $response
            ->assertRedirect(route('settings.truck-grading.edit'))
            ->assertSessionHasErrors(['grade_thresholds']);

        $this->assertDatabaseCount('truck_grading_settings', 0);
        Bus::assertNotDispatched(RecalculateTruckGradeSnapshots::class);
    }
}
