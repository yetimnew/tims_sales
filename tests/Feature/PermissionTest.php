<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\User;
use Database\Seeders\CheckPermissionSeeder;
use Database\Seeders\ReportPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CheckPermissionSeeder::class);
        $this->seed(ReportPermissionSeeder::class);
    }

    /** @test */
    public function it_seeds_default_roles_and_core_permissions()
    {
        $this->assertNotNull(Role::where('name', 'admin')->first());
        $this->assertNotNull(Role::where('name', 'manager')->first());
        $this->assertNotNull(Role::where('name', 'user')->first());

        $this->assertTrue(Permission::where('name', 'users.view')->exists());
        $this->assertTrue(Permission::where('name', 'roles.view')->exists());
        $this->assertTrue(Permission::where('name', 'permissions.view')->exists());
        $this->assertTrue(Permission::where('name', 'trucks.show')->exists());
    }

    /** @test */
    public function admin_role_has_all_permissions()
    {
        $admin = Role::where('name', 'admin')->firstOrFail();
        $allPermissionNames = Permission::pluck('name');

        foreach ($allPermissionNames as $name) {
            $this->assertTrue($admin->hasPermissionTo($name), "Admin missing permission: {$name}");
        }
    }

    /** @test */
    public function manager_role_has_all_except_destroy()
    {
        $manager = Role::where('name', 'manager')->firstOrFail();
        $allPermissionNames = Permission::pluck('name');

        foreach ($allPermissionNames as $name) {
            if (str_contains($name, '.destroy')) {
                $this->assertFalse($manager->hasPermissionTo($name), "Manager should not have destroy permission: {$name}");
            } else {
                $this->assertTrue($manager->hasPermissionTo($name), "Manager missing non-destroy permission: {$name}");
            }
        }
    }

    /** @test */
    public function user_role_is_view_show_export_only()
    {
        $userRole = Role::where('name', 'user')->firstOrFail();

        $viewLike = ['view', 'show', 'export'];
        foreach (Permission::all() as $permission) {
            $segments = explode('.', $permission->name);
            $action = end($segments);
            $action = is_string($action) ? $action : '';
            if (in_array($action, $viewLike, true)) {
                $this->assertTrue($userRole->hasPermissionTo($permission->name), "User role should have {$permission->name}");
            } else {
                $this->assertFalse($userRole->hasPermissionTo($permission->name), "User role should not have {$permission->name}");
            }
        }
    }

    /** @test */
    public function it_can_assign_and_revoke_permissions_via_role()
    {
        $role = Role::create(['name' => 'custom', 'guard_name' => 'web']);
        $permCreate = Permission::firstOrCreate(['name' => 'trucks.create', 'guard_name' => 'web']);

        $role->givePermissionTo($permCreate);
        $this->assertTrue($role->hasPermissionTo('trucks.create'));

        $role->revokePermissionTo($permCreate);
        $this->assertFalse($role->hasPermissionTo('trucks.create'));
    }

    /** @test */
    public function a_users_effective_permissions_come_from_roles()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'custom-role', 'guard_name' => 'web']);
        $permA = Permission::firstOrCreate(['name' => 'trucks.view', 'guard_name' => 'web']);
        $permB = Permission::firstOrCreate(['name' => 'trucks.edit', 'guard_name' => 'web']);

        $role->syncPermissions([$permA, $permB]);
        $user->assignRole($role);

        $this->assertTrue($user->can('trucks.view'));
        $this->assertTrue($user->can('trucks.edit'));
        $this->assertFalse($user->can('trucks.destroy'));

        $this->assertFalse($user->hasDirectPermission('trucks.view'));

        $user->refresh();
        $names = $user->getAllPermissions()->pluck('name')->toArray();
        $this->assertContains('trucks.view', $names);
        $this->assertContains('trucks.edit', $names);
        $this->assertNotContains('trucks.destroy', $names);
    }

    /** @test */
    public function unauthenticated_user_is_redirected_to_login_for_protected_pages()
    {
        $response = $this->get(route('users.index'));
        $response->assertRedirect();
        $response->assertRedirectContains('login');
    }

    /** @test */
    public function user_without_permission_gets_403_on_truck_show()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)->get(route('trucks.show', $truck));
        $response->assertStatus(403);
    }

    /** @test */
    public function user_with_permission_can_access_truck_show()
    {
        $user = User::factory()->create();
        $role = Role::where('name', 'admin')->firstOrFail();
        $user->assignRole($role);

        $truck = Truck::factory()->create();
        $response = $this->actingAs($user)->get(route('trucks.show', $truck));
        $response->assertOk();
    }

    /** @test */
    public function manager_cannot_destroy_users_but_admin_can()
    {
        $target = User::factory()->create();

        // Manager cannot destroy
        $managerUser = User::factory()->create();
        $managerUser->assignRole('manager');
        $respManager = $this->actingAs($managerUser)->delete(route('users.destroy', $target));
        $respManager->assertStatus(403);

        // Admin can destroy (may redirect on success)
        $adminUser = User::factory()->create();
        $adminUser->assignRole('admin');
        $respAdmin = $this->actingAs($adminUser)->delete(route('users.destroy', $target));
        $this->assertTrue(in_array($respAdmin->getStatusCode(), [200, 302, 204], true));
    }

    /** @test */
    public function basic_users_can_only_view_users_index_and_show()
    {
        $basic = User::factory()->create();
        $basic->assignRole('user');

        // Can view index
        $this->actingAs($basic)->get(route('users.index'))->assertOk();

        // Can view show
        $other = User::factory()->create();
        $this->actingAs($basic)->get(route('users.show', $other))->assertOk();

        // Cannot access create/store/edit/update/destroy
        $this->actingAs($basic)->get(route('users.create'))->assertStatus(403);
        $this->actingAs($basic)->post(route('users.store'), [])->assertStatus(403);
        $this->actingAs($basic)->get(route('users.edit', $other))->assertStatus(403);
        $this->actingAs($basic)->put(route('users.update', $other), [])->assertStatus(403);
        $this->actingAs($basic)->delete(route('users.destroy', $other))->assertStatus(403);
    }
}
