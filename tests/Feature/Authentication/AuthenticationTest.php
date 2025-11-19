<?php

namespace Tests\Feature\Authentication;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Features;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function registration_behaves_according_to_feature_flag(): void
    {
        $payload = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $getResponse = $this->get('/register');
        $postResponse = $this->post('/register', $payload);

        if (Features::enabled(Features::registration())) {
            $getResponse->assertOk();
            $postResponse->assertRedirect('/dashboard');

            $this->assertDatabaseHas('users', [
                'email' => 'test@example.com',
            ]);

            /** @var User|null $user */
            $user = User::where('email', 'test@example.com')->first();
            $this->assertNotNull($user);
            $this->assertTrue(Hash::check('password123', $user->password));

            return;
        }

        $getResponse->assertNotFound();
        $postResponse->assertNotFound();

        $this->assertDatabaseMissing('users', [
            'email' => 'test@example.com',
        ]);
    }

    #[Test]
    public function user_can_login_with_valid_credentials(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    #[Test]
    public function user_cannot_login_with_invalid_credentials(): void
    {
        /** @var User $existingUser */
        $existingUser = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => 'test@example.com',
            'password' => 'invalid-password',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    #[Test]
    public function user_can_logout(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $response->assertRedirect('/');
        $this->assertGuest();
    }

    #[Test]
    public function user_can_request_password_reset_link(): void
    {
        /** @var User $user */
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->post('/forgot-password', [
            'email' => 'test@example.com',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('status');
    }

    #[Test]
    public function user_can_reset_password_using_valid_token(): void
    {
        /** @var User $user */
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = app('auth.password.broker')->createToken($user);

        $response = $this->post('/reset-password', [
            'token' => $token,
            'email' => 'test@example.com',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertRedirect('/login');
        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    #[Test]
    public function user_can_update_password_via_settings(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'password' => Hash::make('old-password-123'),
        ]);

        $response = $this->actingAs($user)->put('/settings/password', [
            'current_password' => 'old-password-123',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertRedirect();
        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    #[Test]
    public function profile_settings_routes_are_accessible_to_authenticated_users(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $this->actingAs($user)->get('/settings/profile')->assertOk();

        $response = $this->actingAs($user)->patch('/settings/profile', [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ]);

        $response->assertRedirect(route('profile.edit'));
        $this->assertSame('Updated Name', $user->fresh()->name);
        $this->assertSame('updated@example.com', $user->fresh()->email);
    }

    #[Test]
    public function guest_cannot_access_protected_routes(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/settings/profile')->assertRedirect('/login');
    }

    #[Test]
    public function authenticated_user_can_access_dashboard_and_settings(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $this->actingAs($user)->get('/dashboard')->assertOk();
        $this->actingAs($user)->get('/settings/profile')->assertOk();
    }

    #[Test]
    public function two_factor_routes_respect_feature_configuration(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $settingsResponse = $this->actingAs($user)->get('/settings/two-factor');

        if (Features::canManageTwoFactorAuthentication()) {
            $settingsResponse->assertOk();
        } else {
            $settingsResponse->assertForbidden();
        }

        $legacyEnableResponse = $this->actingAs($user)->post('/user/two-factor-authentication');
        $legacyEnableResponse->assertNotFound();
    }

    #[Test]
    public function legacy_api_token_routes_are_not_exposed(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $this->actingAs($user)->get('/user/api-tokens')->assertNotFound();
        $this->actingAs($user)->post('/user/api-tokens', ['name' => 'Test'])->assertNotFound();
    }
}
