<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $manager;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            'https://api.pwnedpasswords.com/*' => Http::response('', 200),
        ]);

        Carbon::setTestNow(now());

        // Seed permissions first
        $this->seed(\Database\Seeders\CheckPermissionSeeder::class);

        // Create admin user
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        // Create manager user
        $this->manager = User::factory()->create();
        $this->manager->assignRole('manager');

        // Create regular user
        $this->user = User::factory()->create();
        $this->user->assignRole('user');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function strongPassword(): string
    {
        return 'Aa1!'.Str::random(20);
    }

    /** @test */
    public function admin_can_view_users_index()
    {
        $response = $this->actingAs($this->admin)->get(route('users.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Users/Index'));
    }

    /** @test */
    public function admin_can_create_user_with_role()
    {
        $password = $this->strongPassword();

        $userData = [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => $password,
            'password_confirmation' => $password,
            'role' => 'user',
        ];

        $response = $this->actingAs($this->admin)->post(route('users.store'), $userData);

        $response->assertRedirect(route('users.index'));
        $response->assertSessionHas('success', 'User created successfully.');

        $this->assertDatabaseHas('users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
        ]);

        $createdUser = User::where('email', 'newuser@example.com')->first();
        $this->assertTrue($createdUser->hasRole('user'));
    }

    /** @test */
    public function admin_can_update_user()
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        $updateData = [
            'name' => 'Updated User',
            'email' => 'updated@example.com',
            'role' => 'manager',
        ];

        $response = $this->actingAs($this->admin)->put(route('users.update', $user), $updateData);

        $response->assertRedirect(route('users.index'));
        $response->assertSessionHas('success', 'User updated successfully.');

        $user->refresh();
        $this->assertEquals('Updated User', $user->name);
        $this->assertEquals('updated@example.com', $user->email);
        $this->assertTrue($user->hasRole('manager'));
    }

    /** @test */
    public function admin_can_update_user_with_new_password()
    {
        $user = User::factory()->create();
        $user->assignRole('user');
        $oldPassword = $user->password;

        $newPassword = $this->strongPassword();

        $updateData = [
            'name' => 'Updated User',
            'email' => 'updated@example.com',
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
            'role' => 'user',
        ];

        $response = $this->actingAs($this->admin)->put(route('users.update', $user), $updateData);

        $response->assertRedirect(route('users.index'));

        $user->refresh();
        $this->assertNotEquals($oldPassword, $user->password);
        $this->assertTrue(Hash::check($newPassword, $user->password));
    }

    /** @test */
    public function admin_can_delete_user()
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        $response = $this->actingAs($this->admin)->delete(route('users.destroy', $user));

        $response->assertRedirect(route('users.index'));
        $response->assertSessionHas('success', 'User deleted successfully.');

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    /** @test */
    public function admin_cannot_delete_themselves()
    {
        $response = $this->actingAs($this->admin)->delete(route('users.destroy', $this->admin));

        $response->assertRedirect();
        $response->assertSessionHasErrors(['error' => 'You cannot delete your own account.']);

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    /** @test */
    public function admin_can_export_users_to_csv()
    {
        $response = $this->actingAs($this->admin)->get(route('users.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="users_'.now()->format('Y-m-d_H-i-s').'.csv"');
    }

    /** @test */
    public function manager_cannot_delete_users()
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        $response = $this->actingAs($this->manager)->delete(route('users.destroy', $user));

        $response->assertStatus(403);
    }

    /** @test */
    public function regular_user_can_view_users_but_cannot_create()
    {
        $response = $this->actingAs($this->user)->get(route('users.index'));

        $response->assertStatus(200);

        // But cannot create users
        $password = $this->strongPassword();

        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => $password,
            'password_confirmation' => $password,
            'role' => 'user',
        ];

        $response = $this->actingAs($this->user)->post(route('users.store'), $userData);
        $response->assertStatus(403);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_user_management()
    {
        $response = $this->get(route('users.index'));

        $response->assertRedirect(route('login'));
    }

    /** @test */
    public function registration_routes_are_disabled()
    {
        $response = $this->get('/register');

        $response->assertStatus(404);
    }

    /** @test */
    public function unauthenticated_users_cannot_register()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'Password123!@#',
        ];

        $response = $this->post('/register', $userData);

        $response->assertStatus(404);
    }

    /** @test */
    public function user_creation_requires_authentication()
    {
        $password = $this->strongPassword();

        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => $password,
            'password_confirmation' => $password,
            'role' => 'user',
        ];

        $response = $this->post(route('users.store'), $userData);

        $response->assertRedirect(route('login'));
    }

    /** @test */
    public function user_creation_requires_permission()
    {
        $password = $this->strongPassword();

        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => $password,
            'password_confirmation' => $password,
            'role' => 'user',
        ];

        $response = $this->actingAs($this->user)->post(route('users.store'), $userData);

        $response->assertStatus(403);
    }

    /** @test */
    public function user_update_requires_permission()
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        $updateData = [
            'name' => 'Updated User',
            'email' => 'updated@example.com',
            'role' => 'user',
        ];

        $response = $this->actingAs($this->user)->put(route('users.update', $user), $updateData);

        $response->assertStatus(403);
    }

    /** @test */
    public function user_deletion_requires_permission()
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        $response = $this->actingAs($this->user)->delete(route('users.destroy', $user));

        $response->assertStatus(403);
    }

    /** @test */
    public function user_can_export_users()
    {
        $response = $this->actingAs($this->user)->get(route('users.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    /** @test */
    public function user_creation_validates_required_fields()
    {
        $response = $this->actingAs($this->admin)->post(route('users.store'), []);

        $response->assertSessionHasErrors(['name', 'email', 'password', 'role']);
    }

    /** @test */
    public function user_creation_validates_email_uniqueness()
    {
        $existingUser = User::factory()->create(['email' => 'existing@example.com']);

        $password = $this->strongPassword();

        $userData = [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'password' => $password,
            'password_confirmation' => $password,
            'role' => 'user',
        ];

        $response = $this->actingAs($this->admin)->post(route('users.store'), $userData);

        $response->assertSessionHasErrors(['email']);
    }

    /** @test */
    public function user_creation_validates_password_confirmation()
    {
        $password = $this->strongPassword();

        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => $password,
            'password_confirmation' => $password.'mismatch',
            'role' => 'user',
        ];

        $response = $this->actingAs($this->admin)->post(route('users.store'), $userData);

        $response->assertSessionHasErrors(['password']);
    }

    /** @test */
    public function user_creation_validates_role_exists()
    {
        $password = $this->strongPassword();

        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => $password,
            'password_confirmation' => $password,
            'role' => 'nonexistent',
        ];

        $response = $this->actingAs($this->admin)->post(route('users.store'), $userData);

        $response->assertSessionHasErrors(['role']);
    }
}
