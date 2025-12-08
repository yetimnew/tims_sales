<?php

namespace Tests\Feature\Notification;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user with permissions
        $this->user = User::factory()->create();

        // Create permissions
        $permissions = [
            'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.destroy',
            'trucks.show', 'trucks.store', 'trucks.update',
            'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.destroy',
            'drivers.show', 'drivers.store', 'drivers.update', 'drivers.export',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create role and assign permissions
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $role->givePermissionTo($permissions);
        $this->user->assignRole($role);

        Notification::fake();
    }

    #[Test]
    public function user_can_receive_notifications()
    {
        $user = User::factory()->create();

        $user->notify(new \App\Notifications\TestNotification('Test message'));

        Notification::assertSentTo($user, \App\Notifications\TestNotification::class);
    }

    #[Test]
    public function user_can_mark_notification_as_read()
    {
        $user = User::factory()->create();
        $notification = $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Test message'],
            'read_at' => null,
        ]);

        $response = $this->actingAs($user)
            ->post('/notifications/'.$notification->id.'/read');

        $response->assertRedirect();
        $this->assertNotNull($notification->fresh()->read_at);
    }

    #[Test]
    public function user_can_mark_all_notifications_as_read()
    {
        $user = User::factory()->create();
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Test message 1'],
            'read_at' => null,
        ]);
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Test message 2'],
            'read_at' => null,
        ]);

        $response = $this->actingAs($user)
            ->post('/notifications/mark-all-read');

        $response->assertRedirect();
        $this->assertEquals(2, $user->fresh()->unreadNotifications->count());
    }

    #[Test]
    public function user_can_delete_notification()
    {
        $user = User::factory()->create();
        $notification = $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Test message'],
        ]);

        $response = $this->actingAs($user)
            ->delete('/notifications/'.$notification->id);

        $response->assertRedirect();
        $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
    }

    #[Test]
    public function user_can_delete_all_notifications()
    {
        $user = User::factory()->create();
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Test message 1'],
        ]);
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Test message 2'],
        ]);

        $response = $this->actingAs($user)
            ->delete('/notifications/delete-all');

        $response->assertRedirect();
        $this->assertEquals(0, $user->fresh()->notifications->count());
    }

    #[Test]
    public function user_can_view_notifications()
    {
        $user = User::factory()->create();
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Test message'],
        ]);

        $response = $this->actingAs($user)
            ->get('/notifications');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Index')
            ->has('notifications.data', 1)
        );
    }

    #[Test]
    public function user_can_filter_notifications_by_type()
    {
        $user = User::factory()->create();
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Test message'],
        ]);
        $user->notifications()->create([
            'type' => \App\Notifications\AnotherNotification::class,
            'data' => ['message' => 'Another message'],
        ]);

        $response = $this->actingAs($user)
            ->get('/notifications?type=TestNotification');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Index')
            ->has('notifications.data', 1)
        );
    }

    #[Test]
    public function user_can_filter_notifications_by_status()
    {
        $user = User::factory()->create();
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Unread message'],
            'read_at' => null,
        ]);
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Read message'],
            'read_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->get('/notifications?status=unread');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Index')
            ->has('notifications.data', 1)
        );
    }

    #[Test]
    public function user_can_search_notifications()
    {
        $user = User::factory()->create();
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Important message'],
        ]);
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Regular message'],
        ]);

        $response = $this->actingAs($user)
            ->get('/notifications?search=Important');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Index')
            ->has('notifications.data', 1)
        );
    }

    #[Test]
    public function user_can_sort_notifications()
    {
        $user = User::factory()->create();
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'First message'],
            'created_at' => now()->subHour(),
        ]);
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Second message'],
            'created_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->get('/notifications?sort=created_at&direction=desc');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Index')
            ->has('notifications.data', 2)
        );
    }

    #[Test]
    public function user_can_paginate_notifications()
    {
        $user = User::factory()->create();

        // Create 25 notifications
        for ($i = 1; $i <= 25; $i++) {
            $user->notifications()->create([
                'type' => \App\Notifications\TestNotification::class,
                'data' => ['message' => "Message {$i}"],
            ]);
        }

        $response = $this->actingAs($user)
            ->get('/notifications?page=2');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Index')
            ->has('notifications.data', 5)
            ->where('notifications.meta.current_page', 2)
        );
    }

    #[Test]
    public function user_can_export_notifications()
    {
        $user = User::factory()->create();
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Test message'],
        ]);

        $response = $this->actingAs($user)
            ->get('/notifications/export');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    #[Test]
    public function user_can_set_notification_preferences()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->put('/user/notification-preferences', [
                'email_notifications' => true,
                'sms_notifications' => false,
                'push_notifications' => true,
                'notification_types' => [
                    'maintenance' => true,
                    'fuel' => false,
                    'financial' => true,
                ],
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email_notifications' => true,
            'sms_notifications' => false,
            'push_notifications' => true,
        ]);
    }

    #[Test]
    public function user_can_send_notification()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->user)
            ->post('/notifications/send', [
                'user_id' => $user->id,
                'type' => 'TestNotification',
                'data' => ['message' => 'Test message'],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Notification::assertSentTo($user, \App\Notifications\TestNotification::class);
    }

    #[Test]
    public function user_can_send_bulk_notification()
    {
        $users = User::factory()->count(5)->create();

        $response = $this->actingAs($this->user)
            ->post('/notifications/send-bulk', [
                'user_ids' => $users->pluck('id')->toArray(),
                'type' => 'TestNotification',
                'data' => ['message' => 'Bulk message'],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        foreach ($users as $user) {
            Notification::assertSentTo($user, \App\Notifications\TestNotification::class);
        }
    }

    #[Test]
    public function user_can_schedule_notification()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->user)
            ->post('/notifications/schedule', [
                'user_id' => $user->id,
                'type' => 'TestNotification',
                'data' => ['message' => 'Scheduled message'],
                'send_at' => now()->addHour(),
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function user_can_cancel_scheduled_notification()
    {
        $user = User::factory()->create();
        $scheduledNotification = \App\Models\ScheduledNotification::create([
            'user_id' => $user->id,
            'type' => 'TestNotification',
            'data' => ['message' => 'Scheduled message'],
            'send_at' => now()->addHour(),
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/notifications/scheduled/'.$scheduledNotification->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('scheduled_notifications', [
            'id' => $scheduledNotification->id,
        ]);
    }

    #[Test]
    public function user_can_view_notification_statistics()
    {
        $user = User::factory()->create();
        $user->notifications()->create([
            'type' => \App\Notifications\TestNotification::class,
            'data' => ['message' => 'Test message'],
            'read_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->get('/notifications/statistics');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Statistics')
            ->has('statistics')
        );
    }

    #[Test]
    public function user_can_view_notification_templates()
    {
        $response = $this->actingAs($this->user)
            ->get('/notifications/templates');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Templates')
            ->has('templates')
        );
    }

    #[Test]
    public function user_can_create_notification_template()
    {
        $response = $this->actingAs($this->user)
            ->post('/notifications/templates', [
                'name' => 'Test Template',
                'subject' => 'Test Subject',
                'body' => 'Test Body',
                'type' => 'email',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('notification_templates', [
            'name' => 'Test Template',
            'subject' => 'Test Subject',
            'body' => 'Test Body',
            'type' => 'email',
        ]);
    }

    #[Test]
    public function user_can_edit_notification_template()
    {
        $template = \App\Models\NotificationTemplate::create([
            'name' => 'Test Template',
            'subject' => 'Test Subject',
            'body' => 'Test Body',
            'type' => 'email',
        ]);

        $response = $this->actingAs($this->user)
            ->put('/notifications/templates/'.$template->id, [
                'name' => 'Updated Template',
                'subject' => 'Updated Subject',
                'body' => 'Updated Body',
                'type' => 'email',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('notification_templates', [
            'id' => $template->id,
            'name' => 'Updated Template',
            'subject' => 'Updated Subject',
            'body' => 'Updated Body',
        ]);
    }

    #[Test]
    public function user_can_delete_notification_template()
    {
        $template = \App\Models\NotificationTemplate::create([
            'name' => 'Test Template',
            'subject' => 'Test Subject',
            'body' => 'Test Body',
            'type' => 'email',
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/notifications/templates/'.$template->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('notification_templates', [
            'id' => $template->id,
        ]);
    }

    #[Test]
    public function user_can_preview_notification_template()
    {
        $template = \App\Models\NotificationTemplate::create([
            'name' => 'Test Template',
            'subject' => 'Test Subject',
            'body' => 'Test Body',
            'type' => 'email',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/notifications/templates/'.$template->id.'/preview');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/TemplatePreview')
            ->has('template')
        );
    }

    #[Test]
    public function user_can_test_notification_template()
    {
        $template = \App\Models\NotificationTemplate::create([
            'name' => 'Test Template',
            'subject' => 'Test Subject',
            'body' => 'Test Body',
            'type' => 'email',
        ]);

        $response = $this->actingAs($this->user)
            ->post('/notifications/templates/'.$template->id.'/test', [
                'email' => 'test@example.com',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Notification::assertSentTo(
            $this->user,
            \App\Notifications\TestNotification::class
        );
    }

    #[Test]
    public function user_can_view_notification_logs()
    {
        $response = $this->actingAs($this->user)
            ->get('/notifications/logs');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Logs')
            ->has('logs')
        );
    }

    #[Test]
    public function user_can_export_notification_logs()
    {
        $response = $this->actingAs($this->user)
            ->get('/notifications/logs/export');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    #[Test]
    public function user_can_clear_notification_logs()
    {
        $response = $this->actingAs($this->user)
            ->delete('/notifications/logs/clear');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function user_can_view_notification_settings()
    {
        $response = $this->actingAs($this->user)
            ->get('/notifications/settings');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Settings')
            ->has('settings')
        );
    }

    #[Test]
    public function user_can_update_notification_settings()
    {
        $response = $this->actingAs($this->user)
            ->put('/notifications/settings', [
                'email_enabled' => true,
                'sms_enabled' => false,
                'push_enabled' => true,
                'frequency' => 'immediate',
                'quiet_hours_start' => '22:00',
                'quiet_hours_end' => '08:00',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function user_can_view_notification_channels()
    {
        $response = $this->actingAs($this->user)
            ->get('/notifications/channels');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Channels')
            ->has('channels')
        );
    }

    #[Test]
    public function user_can_create_notification_channel()
    {
        $response = $this->actingAs($this->user)
            ->post('/notifications/channels', [
                'name' => 'Test Channel',
                'type' => 'email',
                'config' => [
                    'smtp_host' => 'smtp.example.com',
                    'smtp_port' => 587,
                    'smtp_username' => 'test@example.com',
                    'smtp_password' => 'password',
                ],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('notification_channels', [
            'name' => 'Test Channel',
            'type' => 'email',
        ]);
    }

    #[Test]
    public function user_can_test_notification_channel()
    {
        $channel = \App\Models\NotificationChannel::create([
            'name' => 'Test Channel',
            'type' => 'email',
            'config' => [
                'smtp_host' => 'smtp.example.com',
                'smtp_port' => 587,
                'smtp_username' => 'test@example.com',
                'smtp_password' => 'password',
            ],
        ]);

        $response = $this->actingAs($this->user)
            ->post('/notifications/channels/'.$channel->id.'/test', [
                'email' => 'test@example.com',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function user_can_view_notification_analytics()
    {
        $response = $this->actingAs($this->user)
            ->get('/notifications/analytics');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Analytics')
            ->has('analytics')
        );
    }

    #[Test]
    public function user_can_view_notification_reports()
    {
        $response = $this->actingAs($this->user)
            ->get('/notifications/reports');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Reports')
            ->has('reports')
        );
    }

    #[Test]
    public function user_can_generate_notification_report()
    {
        $response = $this->actingAs($this->user)
            ->post('/notifications/reports/generate', [
                'start_date' => '2023-01-01',
                'end_date' => '2023-12-31',
                'type' => 'summary',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function user_can_download_notification_report()
    {
        $report = \App\Models\NotificationReport::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'data' => ['test' => 'data'],
            'generated_at' => now(),
        ]);

        $response = $this->actingAs($this->user)
            ->get('/notifications/reports/'.$report->id.'/download');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }
}
