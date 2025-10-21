<?php

namespace Tests\Feature\Authentication;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_register()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        $response = $this->post('/register', $userData);

        $response->assertRedirect('/dashboard');
        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com'
        ]);

        $user = User::where('email', 'test@example.com')->first();
        $this->assertTrue(Hash::check('password123', $user->password));
    }

    /** @test */
    public function user_can_login()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);

        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    /** @test */
    public function user_can_logout()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/logout');

        $response->assertRedirect('/');
        $this->assertGuest();
    }

    /** @test */
    public function user_can_request_password_reset()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->post('/forgot-password', [
            'email' => 'test@example.com'
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('status');
    }

    /** @test */
    public function user_can_reset_password()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = app('auth.password.broker')->createToken($user);

        $response = $this->post('/reset-password', [
            'token' => $token,
            'email' => 'test@example.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ]);

        $response->assertRedirect('/login');
        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
    }

    /** @test */
    public function user_can_update_password()
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword123')
        ]);

        $response = $this->actingAs($user)
            ->put('/user/password', [
                'current_password' => 'oldpassword123',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123'
            ]);

        $response->assertRedirect();
        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
    }

    /** @test */
    public function user_can_enable_two_factor_authentication()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/two-factor-authentication');

        $response->assertRedirect();
        $this->assertNotNull($user->fresh()->two_factor_secret);
        $this->assertNotNull($user->fresh()->two_factor_recovery_codes);
    }

    /** @test */
    public function user_can_disable_two_factor_authentication()
    {
        $user = User::factory()->create([
            'two_factor_secret' => 'secret',
            'two_factor_recovery_codes' => ['code1', 'code2']
        ]);

        $response = $this->actingAs($user)
            ->delete('/user/two-factor-authentication');

        $response->assertRedirect();
        $this->assertNull($user->fresh()->two_factor_secret);
        $this->assertNull($user->fresh()->two_factor_recovery_codes);
    }

    /** @test */
    public function user_can_view_recovery_codes()
    {
        $user = User::factory()->create([
            'two_factor_secret' => 'secret',
            'two_factor_recovery_codes' => ['code1', 'code2']
        ]);

        $response = $this->actingAs($user)
            ->get('/user/two-factor-recovery-codes');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_regenerate_recovery_codes()
    {
        $user = User::factory()->create([
            'two_factor_secret' => 'secret',
            'two_factor_recovery_codes' => ['code1', 'code2']
        ]);

        $response = $this->actingAs($user)
            ->post('/user/two-factor-recovery-codes');

        $response->assertRedirect();
        $this->assertNotEquals(['code1', 'code2'], $user->fresh()->two_factor_recovery_codes);
    }

    /** @test */
    public function user_can_confirm_two_factor_authentication()
    {
        $user = User::factory()->create([
            'two_factor_secret' => 'secret'
        ]);

        $response = $this->actingAs($user)
            ->post('/user/confirmed-two-factor-authentication', [
                'code' => '123456'
            ]);

        $response->assertRedirect();
    }

    /** @test */
    public function user_can_use_recovery_code()
    {
        $user = User::factory()->create([
            'two_factor_secret' => 'secret',
            'two_factor_recovery_codes' => ['code1', 'code2']
        ]);

        $response = $this->actingAs($user)
            ->post('/two-factor-challenge', [
                'recovery_code' => 'code1'
            ]);

        $response->assertRedirect('/dashboard');
    }

    /** @test */
    public function user_can_view_profile()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/profile');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_update_profile()
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.com'
        ]);

        $response = $this->actingAs($user)
            ->put('/user/profile-information', [
                'name' => 'New Name',
                'email' => 'new@example.com'
            ]);

        $response->assertRedirect();
        $this->assertEquals('New Name', $user->fresh()->name);
        $this->assertEquals('new@example.com', $user->fresh()->email);
    }

    /** @test */
    public function user_can_delete_account()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->delete('/user', [
                'password' => 'password'
            ]);

        $response->assertRedirect('/');
        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    /** @test */
    public function user_can_view_dashboard()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/dashboard');

        $response->assertStatus(200);
    }

    /** @test */
    public function guest_cannot_access_protected_routes()
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');

        $response = $this->get('/user/profile');
        $response->assertRedirect('/login');

        $response = $this->get('/trucks');
        $response->assertRedirect('/login');
    }

    /** @test */
    public function authenticated_user_can_access_protected_routes()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/dashboard');

        $response->assertStatus(200);

        $response = $this->actingAs($user)
            ->get('/user/profile');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_remember_login()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);

        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
            'remember' => true
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->remember_token);
    }

    /** @test */
    public function user_can_verify_email()
    {
        $user = User::factory()->create([
            'email_verified_at' => null
        ]);

        $response = $this->actingAs($user)
            ->post('/email/verification-notification');

        $response->assertRedirect();
        $response->assertSessionHas('status');
    }

    /** @test */
    public function user_can_resend_verification_email()
    {
        $user = User::factory()->create([
            'email_verified_at' => null
        ]);

        $response = $this->actingAs($user)
            ->post('/email/verification-notification');

        $response->assertRedirect();
        $response->assertSessionHas('status');
    }

    /** @test */
    public function user_can_confirm_password()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123')
        ]);

        $response = $this->actingAs($user)
            ->post('/user/confirm-password', [
                'password' => 'password123'
            ]);

        $response->assertRedirect();
    }

    /** @test */
    public function user_can_view_two_factor_authentication_settings()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/two-factor-authentication');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_view_api_tokens()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/api-tokens');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_create_api_token()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/api-tokens', [
                'name' => 'Test Token'
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('personal_access_tokens', [
            'name' => 'Test Token',
            'tokenable_id' => $user->id
        ]);
    }

    /** @test */
    public function user_can_delete_api_token()
    {
        $user = User::factory()->create();
        $token = $user->createToken('Test Token');

        $response = $this->actingAs($user)
            ->delete('/user/api-tokens/' . $token->accessToken->id);

        $response->assertRedirect();
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $token->accessToken->id
        ]);
    }

    /** @test */
    public function user_can_view_sessions()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/sessions');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_logout_other_sessions()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123')
        ]);

        $response = $this->actingAs($user)
            ->delete('/user/other-browser-sessions', [
                'password' => 'password123'
            ]);

        $response->assertRedirect();
    }

    /** @test */
    public function user_can_view_browser_sessions()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/browser-sessions');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_view_login_history()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/login-history');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_view_security_settings()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/security');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_view_privacy_settings()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/privacy');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_view_notification_settings()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/notifications');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_update_notification_settings()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->put('/user/notifications', [
                'email_notifications' => true,
                'sms_notifications' => false,
                'push_notifications' => true
            ]);

        $response->assertRedirect();
    }

    /** @test */
    public function user_can_view_account_settings()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/account');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_update_account_settings()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->put('/user/account', [
                'timezone' => 'UTC',
                'language' => 'en',
                'date_format' => 'Y-m-d',
                'time_format' => 'H:i:s'
            ]);

        $response->assertRedirect();
    }

    /** @test */
    public function user_can_view_preferences()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/preferences');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_update_preferences()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->put('/user/preferences', [
                'theme' => 'dark',
                'sidebar_collapsed' => true,
                'items_per_page' => 25
            ]);

        $response->assertRedirect();
    }

    /** @test */
    public function user_can_view_activity_log()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/activity');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_export_data()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/export');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/json');
    }

    /** @test */
    public function user_can_download_data()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/download');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/zip');
    }

    /** @test */
    public function user_can_request_data_deletion()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/delete-request', [
                'reason' => 'No longer needed'
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('status');
    }

    /** @test */
    public function user_can_view_data_usage()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/data-usage');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_view_storage_usage()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/storage-usage');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_cleanup_storage()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/cleanup-storage');

        $response->assertRedirect();
        $response->assertSessionHas('status');
    }

    /** @test */
    public function user_can_view_backup_settings()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/user/backup');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_create_backup()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/backup');

        $response->assertRedirect();
        $response->assertSessionHas('status');
    }

    /** @test */
    public function user_can_restore_backup()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/user/restore', [
                'backup_file' => 'test_backup.zip'
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('status');
    }
}
