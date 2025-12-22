<?php

namespace App\Jobs {
    if (! class_exists(RecalculateDriverGradeSnapshots::class, false)) {
        class RecalculateDriverGradeSnapshots
        {
            public static array $dispatched = [];

            public static function dispatch(...$arguments): void
            {
                self::$dispatched[] = $arguments;
            }
        }
    }
}

namespace Tests\Feature {

    use App\Jobs\RecalculateDriverGradeSnapshots;
    use App\Models\DriverGradingSetting;
    use App\Models\User;
    use Illuminate\Foundation\Testing\RefreshDatabase;
    use Tests\TestCase;

    class UpdateDriverGradeThresholdsTest extends TestCase
    {
        use RefreshDatabase;

        public function test_authorized_user_can_update_grade_thresholds(): void
        {
            RecalculateDriverGradeSnapshots::$dispatched = [];

            $user = User::factory()->create();
            $this->givePermissions($user, ['drivers.update']);

            $payload = [
                'grade_thresholds' => [
                    'A' => 92,
                    'B' => 84,
                    'C' => 76,
                    'D' => 65,
                    'E' => 0,
                ],
            ];

            $this->actingAs($user)
                ->patch(route('settings.driver-grading.grade-thresholds.update'), $payload)
                ->assertRedirect(route('settings.driver-grading.edit'))
                ->assertSessionHas('success', 'Driver grading grade thresholds updated.');

            $setting = DriverGradingSetting::query()->latest('updated_at')->first();

            $this->assertNotNull($setting);
            $this->assertSame(
                [
                    'A' => 92,
                    'B' => 84,
                    'C' => 76,
                    'D' => 65,
                    'E' => 0,
                ],
                $setting->grade_thresholds,
            );
            $this->assertSame($user->id, $setting->updated_by);

            $this->assertNotEmpty(RecalculateDriverGradeSnapshots::$dispatched);
            $this->assertSame($user->id, RecalculateDriverGradeSnapshots::$dispatched[0][1]);
        }
    }

}
