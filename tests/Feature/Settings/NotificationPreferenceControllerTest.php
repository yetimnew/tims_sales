<?php

namespace Tests\Feature\Settings;

use App\Models\NotificationType;
use App\Models\User;
use App\Models\UserNotificationSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NotificationPreferenceControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_displays_notification_preferences_page(): void
    {
        $user = User::factory()->create();
        $type = $this->createNotificationType('user.created');

        UserNotificationSetting::create([
            'user_id' => $user->id,
            'notification_type_id' => $type->id,
            'in_app_enabled' => true,
            'email_enabled' => false,
        ]);

        $response = $this->actingAs($user)->get(route('notification-preferences.edit'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('settings/notifications')
                ->has('preferences', 1)
                ->where('preferences.0.key', $type->key)
            );
    }

    #[Test]
    public function it_updates_existing_notification_preferences(): void
    {
        $user = User::factory()->create();
        $type = $this->createNotificationType('user.updated');

        UserNotificationSetting::create([
            'user_id' => $user->id,
            'notification_type_id' => $type->id,
            'in_app_enabled' => true,
            'email_enabled' => false,
        ]);

        $response = $this->actingAs($user)->patch(route('notification-preferences.update'), [
            'preferences' => [
                [
                    'type_id' => $type->id,
                    'in_app_enabled' => false,
                    'email_enabled' => true,
                ],
            ],
        ]);

        $response->assertRedirect(route('notification-preferences.edit'));

        $this->assertDatabaseHas('user_notification_settings', [
            'user_id' => $user->id,
            'notification_type_id' => $type->id,
            'in_app_enabled' => false,
            'email_enabled' => true,
        ]);
    }

    #[Test]
    public function it_ignores_preferences_for_unassigned_types(): void
    {
        $user = User::factory()->create();
        $type = $this->createNotificationType('truck.created');

        $response = $this->actingAs($user)->patch(route('notification-preferences.update'), [
            'preferences' => [
                [
                    'type_id' => $type->id,
                    'in_app_enabled' => true,
                    'email_enabled' => true,
                ],
            ],
        ]);

        $response->assertRedirect(route('notification-preferences.edit'));

        $this->assertDatabaseMissing('user_notification_settings', [
            'user_id' => $user->id,
            'notification_type_id' => $type->id,
        ]);
    }

    private function createNotificationType(string $key): NotificationType
    {
        return NotificationType::create([
            'key' => $key,
            'name' => ucfirst(str_replace('.', ' ', $key)),
            'description' => 'Example notification type.',
            'default_in_app' => true,
            'default_email' => false,
        ]);
    }
}
