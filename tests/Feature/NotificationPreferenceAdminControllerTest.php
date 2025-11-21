<?php

namespace Tests\Feature;

use App\Models\NotificationType;
use App\Models\User;
use App\Models\UserNotificationSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NotificationPreferenceAdminControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_displays_the_notification_assignment_dashboard(): void
    {
        $admin = User::factory()->create();
        $this->givePermissions($admin, ['users.update']);

        $member = User::factory()->create();
        $type = $this->createNotificationType('truck.created');

        UserNotificationSetting::create([
            'user_id' => $member->id,
            'notification_type_id' => $type->id,
            'assigned_by' => $admin->id,
            'in_app_enabled' => true,
            'email_enabled' => false,
        ]);

        $response = $this->actingAs($admin)->get(route('notifications.preferences.index'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Notifications/Preferences')
                ->has('users.data')
                ->where('types.0.key', $type->key)
            );
    }

    #[Test]
    public function it_allows_admins_to_assign_notification_types(): void
    {
        $admin = User::factory()->create();
        $this->givePermissions($admin, ['users.update']);

        $member = User::factory()->create();
        $type = $this->createNotificationType('user.deleted');

        $response = $this->actingAs($admin)->patch(route('notifications.preferences.update', $member), [
            'preferences' => [
                [
                    'type_id' => $type->id,
                    'in_app_enabled' => true,
                    'email_enabled' => false,
                ],
            ],
        ]);

        $response->assertRedirect(route('notifications.preferences.index', ['selected_user' => $member->id]));

        $this->assertDatabaseHas('user_notification_settings', [
            'user_id' => $member->id,
            'notification_type_id' => $type->id,
            'assigned_by' => $admin->id,
            'in_app_enabled' => true,
            'email_enabled' => false,
        ]);
    }

    #[Test]
    public function it_allows_admins_to_remove_notification_types(): void
    {
        $admin = User::factory()->create();
        $this->givePermissions($admin, ['users.update']);

        $member = User::factory()->create();
        $type = $this->createNotificationType('user.updated');

        $setting = UserNotificationSetting::create([
            'user_id' => $member->id,
            'notification_type_id' => $type->id,
            'assigned_by' => $admin->id,
            'in_app_enabled' => true,
            'email_enabled' => true,
        ]);

        $response = $this->actingAs($admin)->patch(route('notifications.preferences.update', $member), [
            'preferences' => [
                [
                    'type_id' => $type->id,
                    'in_app_enabled' => false,
                    'email_enabled' => false,
                    'remove' => true,
                ],
            ],
        ]);

        $response->assertRedirect(route('notifications.preferences.index', ['selected_user' => $member->id]));

        $this->assertDatabaseMissing('user_notification_settings', [
            'id' => $setting->id,
        ]);
    }

    private function createNotificationType(string $key): NotificationType
    {
        return NotificationType::create([
            'key' => $key,
            'name' => ucfirst(str_replace('.', ' ', $key)),
            'description' => 'Admin notification type.',
            'default_in_app' => true,
            'default_email' => false,
        ]);
    }
}
