<?php

namespace Tests\Feature\Settings;

use App\Models\DriverTruck;
use App\Models\DriverTruckGradingSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class DriverTruckGradingSettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_weights_route_updates_weights_and_peer_sample_size_when_valid(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['driver-trucks.update']);

        $response = $this->actingAs($user)
            ->from(route('settings.driver-truck-grading.edit'))
            ->patch(route('settings.driver-truck-grading.weights.update'), [
                'performance_weight' => 45,
                'efficiency_weight' => 35,
                'consistency_weight' => 20,
                'peer_sample_size' => 18,
            ]);

        $response
            ->assertRedirect(route('settings.driver-truck-grading.edit'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Driver-truck grading weights updated.');

        $setting = DriverTruckGradingSetting::query()->latest('updated_at')->first();

        $this->assertNotNull($setting);
        $this->assertSame(45, $setting->performance_weight);
        $this->assertSame(35, $setting->efficiency_weight);
        $this->assertSame(20, $setting->consistency_weight);
        $this->assertSame(18, $setting->peer_sample_size);
        $this->assertSame($user->id, $setting->updated_by);
        $this->assertSame(DriverTruckGradingSetting::defaultGradeThresholds(), $setting->grade_thresholds);
    }

    public function test_weights_route_requires_weights_to_total_one_hundred(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['driver-trucks.update']);

        $response = $this->actingAs($user)
            ->from(route('settings.driver-truck-grading.edit'))
            ->patch(route('settings.driver-truck-grading.weights.update'), [
                'performance_weight' => 40,
                'efficiency_weight' => 35,
                'consistency_weight' => 20,
                'peer_sample_size' => 18,
            ]);

        $response
            ->assertRedirect(route('settings.driver-truck-grading.edit'))
            ->assertSessionHasErrors(['weights']);

        $this->assertDatabaseCount('driver_truck_grading_settings', 0);
    }

    public function test_grade_threshold_route_updates_thresholds_when_valid(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['driver-trucks.update']);

        $response = $this->actingAs($user)
            ->from(route('settings.driver-truck-grading.edit'))
            ->patch(route('settings.driver-truck-grading.grade-thresholds.update'), [
                'grade_thresholds' => [
                    'A' => 92,
                    'B' => 82,
                    'C' => 74,
                    'D' => 60,
                    'E' => 0,
                ],
            ]);

        $response
            ->assertRedirect(route('settings.driver-truck-grading.edit'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Driver-truck grading grade thresholds updated.');

        $setting = DriverTruckGradingSetting::query()->latest('updated_at')->first();

        $this->assertNotNull($setting);
        $this->assertSame($user->id, $setting->updated_by);
        $this->assertSame(
            DriverTruckGradingSetting::normalizeGradeThresholds([
                'A' => 92,
                'B' => 82,
                'C' => 74,
                'D' => 60,
                'E' => 0,
            ]),
            DriverTruckGradingSetting::normalizeGradeThresholds($setting->grade_thresholds),
        );
    }

    public function test_grade_threshold_route_rejects_invalid_threshold_sequence(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['driver-trucks.update']);

        $response = $this->actingAs($user)
            ->from(route('settings.driver-truck-grading.edit'))
            ->patch(route('settings.driver-truck-grading.grade-thresholds.update'), [
                'grade_thresholds' => [
                    'A' => 85,
                    'B' => 90,
                    'C' => 75,
                    'D' => 65,
                    'E' => 5,
                ],
            ]);

        $response
            ->assertRedirect(route('settings.driver-truck-grading.edit'))
            ->assertSessionHasErrors(['grade_thresholds']);

        $this->assertDatabaseCount('driver_truck_grading_settings', 0);
    }

    public function test_recalculate_creates_snapshots_for_assignments(): void
    {
        $user = User::factory()->create();
        Permission::firstOrCreate([
            'name' => 'driver-trucks.update',
            'guard_name' => 'web',
        ]);
        $user->givePermissionTo('driver-trucks.update');

        DriverTruck::factory()->create([
            'status' => 'active',
            'is_attached' => true,
        ]);

        $snapshotDate = Carbon::now()->toDateString();

        $response = $this->actingAs($user)->post(route('settings.driver-truck-grading.recalculate'), [
            'snapshot_date' => $snapshotDate,
            'status' => 'active',
            'attachment_state' => 'attached',
        ]);

        $response
            ->assertRedirect(route('settings.driver-truck-grading.edit', [
                'snapshot_date' => $snapshotDate,
                'status' => 'active',
                'attachment_state' => 'attached',
            ]))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('driver_truck_grade_snapshots', [
            'snapshot_date' => $snapshotDate,
            'filter_status' => 'active',
            'filter_is_attached' => true,
        ]);
    }

    public function test_recalculate_requires_permission(): void
    {
        $user = User::factory()->create();
        DriverTruck::factory()->create();

        $response = $this->actingAs($user)->post(route('settings.driver-truck-grading.recalculate'), [
            'snapshot_date' => Carbon::now()->toDateString(),
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('driver_truck_grade_snapshots', 0);
    }
}
