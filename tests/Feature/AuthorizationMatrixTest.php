<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\CheckPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthorizationMatrixTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CheckPermissionSeeder::class);
    }

    /** @test */
    public function admin_can_manage_users_roles_and_view_permissions()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // Users
        $this->actingAs($admin)->get(route('users.index'))->assertOk();
        $this->actingAs($admin)->get(route('users.create'))->assertOk();

        $target = User::factory()->create();
        $this->actingAs($admin)->get(route('users.show', $target))->assertOk();
        $this->actingAs($admin)->get(route('users.edit', $target))->assertOk();
        $this->assertTrue(in_array($this->actingAs($admin)->delete(route('users.destroy', $target))->getStatusCode(), [200, 204, 302], true));

        // Roles
        $this->actingAs($admin)->get(route('roles.index'))->assertOk();
        $this->actingAs($admin)->get(route('roles.create'))->assertOk();

        $role = Role::create(['name' => 'temp-role', 'guard_name' => 'web']);
        $this->actingAs($admin)->get(route('roles.show', $role))->assertOk();
        $this->actingAs($admin)->get(route('roles.edit', $role))->assertOk();
        $this->assertTrue(in_array($this->actingAs($admin)->delete(route('roles.destroy', $role))->getStatusCode(), [200, 204, 302], true));

        // Permissions (read-only UI)
        $this->actingAs($admin)->get(route('permissions.index'))->assertOk();
    }

    /** @test */
    public function manager_can_manage_but_cannot_destroy_users_and_roles()
    {
        $manager = User::factory()->create();
        $manager->assignRole('manager');

        // Users
        $this->actingAs($manager)->get(route('users.index'))->assertOk();
        $this->actingAs($manager)->get(route('users.create'))->assertOk();

        $target = User::factory()->create();
        $this->actingAs($manager)->get(route('users.show', $target))->assertOk();
        $this->actingAs($manager)->get(route('users.edit', $target))->assertOk();
        $this->actingAs($manager)->delete(route('users.destroy', $target))->assertStatus(403);

        // Roles
        $this->actingAs($manager)->get(route('roles.index'))->assertOk();
        $this->actingAs($manager)->get(route('roles.create'))->assertOk();

        $role = Role::create(['name' => 'temp-role-2', 'guard_name' => 'web']);
        $this->actingAs($manager)->get(route('roles.show', $role))->assertOk();
        $this->actingAs($manager)->get(route('roles.edit', $role))->assertOk();
        $this->actingAs($manager)->delete(route('roles.destroy', $role))->assertStatus(403);

        // Permissions (read-only UI available to manager)
        $this->actingAs($manager)->get(route('permissions.index'))->assertOk();
    }

    /** @test */
    public function basic_user_has_view_only_access()
    {
        $basic = User::factory()->create();
        $basic->assignRole('user');

        // Users
        $target = User::factory()->create();
        $this->actingAs($basic)->get(route('users.index'))->assertOk();
        $this->actingAs($basic)->get(route('users.show', $target))->assertOk();
        $this->actingAs($basic)->get(route('users.create'))->assertStatus(403);
        $this->actingAs($basic)->get(route('users.edit', $target))->assertStatus(403);

        // Roles
        $role = Role::create(['name' => 'temp-role-3', 'guard_name' => 'web']);
        $this->actingAs($basic)->get(route('roles.index'))->assertOk();
        $this->actingAs($basic)->get(route('roles.show', $role))->assertOk();
        $this->actingAs($basic)->get(route('roles.create'))->assertStatus(403);
        $this->actingAs($basic)->get(route('roles.edit', $role))->assertStatus(403);

        // Permissions
        $this->actingAs($basic)->get(route('permissions.index'))->assertOk();
    }
}



