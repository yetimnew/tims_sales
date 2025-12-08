<?php

namespace Tests\Feature;

use App\Models\NotificationType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserNotificationPreferencesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['broadcasting.default' => 'log']);
    }

    #[Test]
    public function it_assigns_notification_preferences_for_non_admin_user(): void
    {
        $admin = User::factory()->create();

        $permission = Permission::create(['name' => 'users.store', 'guard_name' => 'web']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $managerRole = Role::create(['name' => 'manager', 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permission);
        $admin->assignRole($adminRole);

        $notificationType = NotificationType::create([
            'key' => NotificationType::TRUCK_CREATED,
            'name' => 'Truck Created',
            'description' => 'Triggered when a truck is added.',
            'default_in_app' => true,
            'default_email' => false,
        ]);

        $password = 'Secure#1'.Str::random(10);

        $response = $this->actingAs($admin)
            ->post(route('users.store'), [
                'name' => 'Fleet Manager',
                'email' => 'fleet.manager@example.com',
                'password' => $password,
                'password_confirmation' => $password,
                'role' => $managerRole->name,
                'notification_preferences' => [
                    [
                        'type_id' => $notificationType->id,
                        'in_app_enabled' => true,
                        'email_enabled' => true,
                    ],
                ],
            ]);

        $response->assertRedirect(route('users.index'));

        $createdUser = User::where('email', 'fleet.manager@example.com')->first();
        $this->assertNotNull($createdUser);

        $this->assertDatabaseHas('user_notification_settings', [
            'user_id' => $createdUser->id,
            'notification_type_id' => $notificationType->id,
            'in_app_enabled' => true,
            'email_enabled' => true,
            'assigned_by' => $admin->id,
        ]);
    }

    #[Test]
    public function it_ignores_notification_preferences_without_enabled_channels(): void
    {
        $admin = User::factory()->create();

        $permission = Permission::create(['name' => 'users.store', 'guard_name' => 'web']);
        $role = Role::create(['name' => 'manager', 'guard_name' => 'web']);
        $role->givePermissionTo($permission);
        $admin->assignRole($role);

        $notificationType = NotificationType::create([
            'key' => NotificationType::DRIVER_CREATED,
            'name' => 'Driver Created',
            'description' => 'Triggered when a driver is added.',
            'default_in_app' => true,
            'default_email' => false,
        ]);

        $password = 'Secure#1'.Str::random(10);

        $response = $this->actingAs($admin)
            ->post(route('users.store'), [
                'name' => 'Operations Analyst',
                'email' => 'operations.analyst@example.com',
                'password' => $password,
                'password_confirmation' => $password,
                'role' => $role->name,
                'notification_preferences' => [
                    [
                        'type_id' => $notificationType->id,
                        'in_app_enabled' => false,
                        'email_enabled' => false,
                    ],
                ],
            ]);

        $response->assertRedirect(route('users.index'));

        $createdUser = User::where('email', 'operations.analyst@example.com')->first();
        $this->assertNotNull($createdUser);

        $this->assertDatabaseMissing('user_notification_settings', [
            'user_id' => $createdUser->id,
            'notification_type_id' => $notificationType->id,
        ]);
    }

    #[Test]
    public function it_assigns_all_notifications_when_the_new_user_role_is_admin(): void
    {
        $admin = User::factory()->create();

        $permission = Permission::create(['name' => 'users.store', 'guard_name' => 'web']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->givePermissionTo($permission);
        $admin->assignRole($adminRole);

        $notificationTypeA = NotificationType::create([
            'key' => NotificationType::USER_CREATED,
            'name' => 'User Created',
            'description' => 'Triggered when a user is created.',
            'default_in_app' => false,
            'default_email' => false,
        ]);

        $notificationTypeB = NotificationType::create([
            'key' => NotificationType::USER_UPDATED,
            'name' => 'User Updated',
            'description' => 'Triggered when a user is updated.',
            'default_in_app' => true,
            'default_email' => true,
        ]);

        $password = 'Secure#1'.Str::random(10);

        $response = $this->actingAs($admin)
            ->post(route('users.store'), [
                'name' => 'System Admin',
                'email' => 'system.admin@example.com',
                'password' => $password,
                'password_confirmation' => $password,
                'role' => $adminRole->name,
            ]);

        $response->assertRedirect(route('users.index'));

        $createdUser = User::where('email', 'system.admin@example.com')->first();
        $this->assertNotNull($createdUser);

        $this->assertDatabaseHas('user_notification_settings', [
            'user_id' => $createdUser->id,
            'notification_type_id' => $notificationTypeA->id,
            'in_app_enabled' => true,
            'email_enabled' => true,
            'assigned_by' => $admin->id,
        ]);

        $this->assertDatabaseHas('user_notification_settings', [
            'user_id' => $createdUser->id,
            'notification_type_id' => $notificationTypeB->id,
            'in_app_enabled' => true,
            'email_enabled' => true,
            'assigned_by' => $admin->id,
        ]);

        $this->assertSame(2, $createdUser->notificationSettings()->count());
    }
}
