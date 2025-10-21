<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Truck;
use App\Models\Driver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_permissions()
    {
        $permission = Permission::create([
            'name' => 'trucks.create',
            'guard_name' => 'web'
        ]);

        $this->assertInstanceOf(Permission::class, $permission);
        $this->assertEquals('trucks.create', $permission->name);
        $this->assertEquals('web', $permission->guard_name);
    }

    /** @test */
    public function it_can_create_roles()
    {
        $role = Role::create([
            'name' => 'admin',
            'guard_name' => 'web'
        ]);

        $this->assertInstanceOf(Role::class, $role);
        $this->assertEquals('admin', $role->name);
        $this->assertEquals('web', $role->guard_name);
    }

    /** @test */
    public function it_can_assign_permissions_to_roles()
    {
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $permission = Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']);

        $role->givePermissionTo($permission);

        $this->assertTrue($role->hasPermissionTo('trucks.create'));
        $this->assertCount(1, $role->permissions);
    }

    /** @test */
    public function it_can_assign_roles_to_users()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $user->assignRole($role);

        $this->assertTrue($user->hasRole('admin'));
        $this->assertCount(1, $user->roles);
    }

    /** @test */
    public function it_can_check_user_permissions()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $permission = Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']);

        $role->givePermissionTo($permission);
        $user->assignRole($role);

        $this->assertTrue($user->hasPermissionTo('trucks.create'));
        $this->assertTrue($user->can('trucks.create'));
    }

    /** @test */
    public function it_denies_access_without_permission()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_allows_access_with_permission()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $permission = Permission::create(['name' => 'trucks.show', 'guard_name' => 'web']);

        $role->givePermissionTo($permission);
        $user->assignRole($role);

        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(200);
    }

    /** @test */
    public function it_can_check_multiple_permissions()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $permissions = [
            Permission::create(['name' => 'trucks.view', 'guard_name' => 'web']),
            Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']),
            Permission::create(['name' => 'trucks.edit', 'guard_name' => 'web']),
        ];

        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $this->assertTrue($user->hasAllPermissions(['trucks.view', 'trucks.create']));
        $this->assertTrue($user->hasAnyPermission(['trucks.view', 'trucks.delete']));
        $this->assertFalse($user->hasAllPermissions(['trucks.view', 'trucks.delete']));
    }

    /** @test */
    public function it_can_revoke_permissions_from_roles()
    {
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $permission = Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']);

        $role->givePermissionTo($permission);
        $this->assertTrue($role->hasPermissionTo('trucks.create'));

        $role->revokePermissionTo($permission);
        $this->assertFalse($role->hasPermissionTo('trucks.create'));
    }

    /** @test */
    public function it_can_remove_roles_from_users()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $user->assignRole($role);
        $this->assertTrue($user->hasRole('admin'));

        $user->removeRole($role);
        $this->assertFalse($user->hasRole('admin'));
    }

    /** @test */
    public function it_can_sync_permissions_to_role()
    {
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $permissions = [
            Permission::create(['name' => 'trucks.view', 'guard_name' => 'web']),
            Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']),
            Permission::create(['name' => 'trucks.edit', 'guard_name' => 'web']),
        ];

        $role->syncPermissions($permissions);

        $this->assertCount(3, $role->permissions);
        $this->assertTrue($role->hasPermissionTo('trucks.view'));
        $this->assertTrue($role->hasPermissionTo('trucks.create'));
        $this->assertTrue($role->hasPermissionTo('trucks.edit'));
    }

    /** @test */
    public function it_can_sync_roles_to_user()
    {
        $user = User::factory()->create();

        $roles = [
            Role::create(['name' => 'admin', 'guard_name' => 'web']),
            Role::create(['name' => 'manager', 'guard_name' => 'web']),
        ];

        $user->syncRoles($roles);

        $this->assertCount(2, $user->roles);
        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->hasRole('manager'));
    }

    /** @test */
    public function it_can_check_permission_via_middleware()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        // Without permission
        $response = $this->actingAs($user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(403);

        // With permission
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $permission = Permission::create(['name' => 'trucks.show', 'guard_name' => 'web']);

        $role->givePermissionTo($permission);
        $user->assignRole($role);

        $response = $this->actingAs($user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(200);
    }

    /** @test */
    public function it_can_get_all_permissions_for_user()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $permissions = [
            Permission::create(['name' => 'trucks.view', 'guard_name' => 'web']),
            Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']),
            Permission::create(['name' => 'drivers.view', 'guard_name' => 'web']),
        ];

        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $userPermissions = $user->getAllPermissions();

        $this->assertCount(3, $userPermissions);
        $this->assertTrue($userPermissions->contains('name', 'trucks.view'));
        $this->assertTrue($userPermissions->contains('name', 'trucks.create'));
        $this->assertTrue($userPermissions->contains('name', 'drivers.view'));
    }

    /** @test */
    public function it_can_get_permission_names_for_user()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);

        $permissions = [
            Permission::create(['name' => 'trucks.view', 'guard_name' => 'web']),
            Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']),
        ];

        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $permissionNames = $user->getPermissionNames();

        $this->assertCount(2, $permissionNames);
        $this->assertContains('trucks.view', $permissionNames);
        $this->assertContains('trucks.create', $permissionNames);
    }

    /** @test */
    public function it_can_check_direct_permission_assignment()
    {
        $user = User::factory()->create();
        $permission = Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']);

        $user->givePermissionTo($permission);

        $this->assertTrue($user->hasPermissionTo('trucks.create'));
        $this->assertTrue($user->hasDirectPermission('trucks.create'));
    }

    /** @test */
    public function it_can_revoke_direct_permission()
    {
        $user = User::factory()->create();
        $permission = Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']);

        $user->givePermissionTo($permission);
        $this->assertTrue($user->hasPermissionTo('trucks.create'));

        $user->revokePermissionTo($permission);
        $this->assertFalse($user->hasPermissionTo('trucks.create'));
    }

    /** @test */
    public function it_can_check_permission_via_role()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $permission = Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']);

        $role->givePermissionTo($permission);
        $user->assignRole($role);

        $this->assertTrue($user->hasPermissionTo('trucks.create'));
        $this->assertTrue($user->hasPermissionViaRole('trucks.create'));
    }

    /** @test */
    public function it_can_get_roles_and_permissions_for_user()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $permission = Permission::create(['name' => 'trucks.create', 'guard_name' => 'web']);

        $role->givePermissionTo($permission);
        $user->assignRole($role);

        $this->assertCount(1, $user->roles);
        $this->assertCount(1, $user->permissions);
        $this->assertEquals('admin', $user->roles->first()->name);
        $this->assertEquals('trucks.create', $user->permissions->first()->name);
    }
}
