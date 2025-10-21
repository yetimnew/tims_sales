<?php

namespace Tests\Feature\Email;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EmailTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function verification_email_can_be_sent()
    {
        Mail::fake();

        $user = User::factory()->create([
            'email_verified_at' => null
        ]);

        $response = $this->actingAs($user)
            ->post('/email/verification-notification');

        $response->assertRedirect();
        $response->assertSessionHas('status');

        Mail::assertSent(\Illuminate\Auth\Notifications\VerifyEmail::class);
    }

    /** @test */
    public function password_reset_email_can_be_sent()
    {
        Mail::fake();

        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->post('/forgot-password', [
            'email' => 'test@example.com'
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('status');

        Mail::assertSent(\Illuminate\Auth\Notifications\ResetPassword::class);
    }

    /** @test */
    public function welcome_email_can_be_sent()
    {
        Mail::fake();

        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        $response = $this->post('/register', $userData);

        $response->assertRedirect('/dashboard');

        // Check if welcome email was sent
        Mail::assertSent(\App\Mail\WelcomeEmail::class);
    }

    /** @test */
    public function account_created_notification_can_be_sent()
    {
        Notification::fake();

        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        $response = $this->post('/register', $userData);

        $response->assertRedirect('/dashboard');

        $user = User::where('email', 'test@example.com')->first();
        Notification::assertSentTo($user, \App\Notifications\AccountCreated::class);
    }

    /** @test */
    public function password_changed_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create([
            'password' => \Illuminate\Support\Facades\Hash::make('oldpassword123')
        ]);

        $response = $this->actingAs($user)
            ->put('/user/password', [
                'current_password' => 'oldpassword123',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123'
            ]);

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\PasswordChanged::class);
    }

    /** @test */
    public function email_changed_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'old@example.com'
        ]);

        $response = $this->actingAs($user)
            ->put('/user/profile-information', [
                'name' => $user->name,
                'email' => 'new@example.com'
            ]);

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\EmailChanged::class);
    }

    /** @test */
    public function two_factor_enabled_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/two-factor-authentication');

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\TwoFactorEnabled::class);
    }

    /** @test */
    public function two_factor_disabled_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create([
            'two_factor_secret' => 'secret',
            'two_factor_recovery_codes' => ['code1', 'code2']
        ]);

        $response = $this->actingAs($user)
            ->delete('/user/two-factor-authentication');

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\TwoFactorDisabled::class);
    }

    /** @test */
    public function login_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123')
        ]);

        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);

        $response->assertRedirect('/dashboard');

        Notification::assertSentTo($user, \App\Notifications\LoginNotification::class);
    }

    /** @test */
    public function suspicious_login_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123')
        ]);

        // Simulate login from different IP
        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ], [
            'HTTP_X_FORWARDED_FOR' => '192.168.1.100'
        ]);

        $response->assertRedirect('/dashboard');

        Notification::assertSentTo($user, \App\Notifications\SuspiciousLogin::class);
    }

    /** @test */
    public function account_locked_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123')
        ]);

        // Simulate multiple failed login attempts
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'email' => 'test@example.com',
                'password' => 'wrongpassword'
            ]);
        }

        Notification::assertSentTo($user, \App\Notifications\AccountLocked::class);
    }

    /** @test */
    public function account_unlocked_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'locked_until' => now()->addMinutes(30)
        ]);

        $response = $this->actingAs($user)
            ->post('/user/unlock-account');

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\AccountUnlocked::class);
    }

    /** @test */
    public function data_export_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/export-request');

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\DataExportReady::class);
    }

    /** @test */
    public function data_deletion_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/delete-request', [
                'reason' => 'No longer needed'
            ]);

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\DataDeletionRequested::class);
    }

    /** @test */
    public function backup_completed_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/backup');

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\BackupCompleted::class);
    }

    /** @test */
    public function maintenance_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/maintenance-notification');

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\MaintenanceScheduled::class);
    }

    /** @test */
    public function system_update_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/system-update-notification');

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\SystemUpdate::class);
    }

    /** @test */
    public function security_alert_notification_can_be_sent()
    {
        Notification::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/security-alert');

        $response->assertRedirect();

        Notification::assertSentTo($user, \App\Notifications\SecurityAlert::class);
    }

    /** @test */
    public function email_templates_are_rendered_correctly()
    {
        $user = User::factory()->create();

        // Test welcome email template
        $welcomeEmail = new \App\Mail\WelcomeEmail($user);
        $this->assertStringContainsString($user->name, $welcomeEmail->render());

        // Test password reset email template
        $token = 'test-token';
        $resetEmail = new \Illuminate\Auth\Notifications\ResetPassword($token);
        $this->assertStringContainsString($token, $resetEmail->render());

        // Test verification email template
        $verificationEmail = new \Illuminate\Auth\Notifications\VerifyEmail();
        $this->assertStringContainsString('Verify Email', $verificationEmail->render());
    }

    /** @test */
    public function email_queue_works()
    {
        \Illuminate\Support\Facades\Queue::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/send-notification');

        $response->assertRedirect();

        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\SendNotificationJob::class);
    }

    /** @test */
    public function email_batching_works()
    {
        \Illuminate\Support\Facades\Queue::fake();

        $users = User::factory()->count(10)->create();

        $response = $this->post('/admin/send-bulk-notification', [
            'users' => $users->pluck('id')->toArray(),
            'message' => 'Test message'
        ]);

        $response->assertRedirect();

        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\SendBulkNotificationJob::class);
    }

    /** @test */
    public function email_scheduling_works()
    {
        \Illuminate\Support\Facades\Queue::fake();

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/schedule-notification', [
                'send_at' => now()->addHour()
            ]);

        $response->assertRedirect();

        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\SendScheduledNotificationJob::class);
    }

    /** @test */
    public function email_delivery_failure_handling()
    {
        Mail::fake();
        Mail::shouldReceive('send')
            ->andThrow(new \Exception('Delivery failed'));

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/send-notification');

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    /** @test */
    public function email_bounce_handling()
    {
        $user = User::factory()->create();

        $response = $this->post('/webhook/email-bounce', [
            'email' => $user->email,
            'reason' => 'bounced'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('email_bounces', [
            'email' => $user->email,
            'reason' => 'bounced'
        ]);
    }

    /** @test */
    public function email_complaint_handling()
    {
        $user = User::factory()->create();

        $response = $this->post('/webhook/email-complaint', [
            'email' => $user->email,
            'reason' => 'spam'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('email_complaints', [
            'email' => $user->email,
            'reason' => 'spam'
        ]);
    }

    /** @test */
    public function email_unsubscribe_handling()
    {
        $user = User::factory()->create();

        $response = $this->post('/webhook/email-unsubscribe', [
            'email' => $user->email
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('email_unsubscribes', [
            'email' => $user->email
        ]);
    }

    /** @test */
    public function email_preferences_are_respected()
    {
        $user = User::factory()->create([
            'email_notifications' => false
        ]);

        Notification::fake();

        $response = $this->actingAs($user)
            ->post('/user/send-notification');

        $response->assertRedirect();

        Notification::assertNotSentTo($user, \App\Notifications\TestNotification::class);
    }

    /** @test */
    public function email_frequency_limits_are_respected()
    {
        $user = User::factory()->create();

        Notification::fake();

        // Send first notification
        $this->actingAs($user)
            ->post('/user/send-notification');

        // Try to send second notification immediately
        $this->actingAs($user)
            ->post('/user/send-notification');

        // Should only send one notification
        Notification::assertSentTo($user, \App\Notifications\TestNotification::class, 1);
    }

    /** @test */
    public function email_content_filtering_works()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/send-notification', [
                'content' => 'This is spam content'
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    /** @test */
    public function email_attachment_handling_works()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/send-notification', [
                'attachment' => 'test-file.pdf'
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function email_encryption_works()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/send-encrypted-notification');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function email_digital_signature_works()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/send-signed-notification');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }
}
