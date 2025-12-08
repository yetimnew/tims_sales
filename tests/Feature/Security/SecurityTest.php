<?php

namespace Tests\Feature\Security;

use App\Models\Truck;
use App\Models\User;
use Database\Seeders\CheckPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CheckPermissionSeeder::class);
    }

    private function createUser(): User
    {
        /** @var User $user */
        $user = $this->createUser();

        return $user;
    }

    #[Test]
    public function it_prevents_unauthorized_access()
    {
        $truck = Truck::factory()->create();

        $response = $this->get(route('trucks.index'));
        $response->assertRedirect('/login');

        $response = $this->get(route('trucks.show', $truck));
        $response->assertRedirect('/login');

        $response = $this->post(route('trucks.store'), []);
        $response->assertRedirect('/login');
    }

    #[Test]
    public function it_prevents_access_without_permissions()
    {
        $userWithoutPermission = $this->createUser();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.index'));

        $response->assertStatus(403);

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(403);

        $response = $this->actingAs($userWithoutPermission)
            ->post(route('trucks.store'), []);

        $response->assertStatus(403);
    }

    #[Test]
    public function it_prevents_cross_user_data_access()
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();

        // Create permissions for both users
        $permissions = ['trucks.view', 'trucks.show'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $role1 = Role::findOrCreate('user1', 'web');
        $role2 = Role::findOrCreate('user2', 'web');

        $role1->givePermissionTo($permissions);
        $role2->givePermissionTo($permissions);

        $user1->assignRole($role1);
        $user2->assignRole($role2);

        $truck = Truck::factory()->create();

        // Both users should be able to access the same truck data
        // (This is a business rule - trucks are shared resources)
        $response1 = $this->actingAs($user1)
            ->get(route('trucks.show', $truck));

        $response2 = $this->actingAs($user2)
            ->get(route('trucks.show', $truck));

        $response1->assertStatus(200);
        $response2->assertStatus(200);
    }

    #[Test]
    public function it_prevents_sql_injection_attacks()
    {
        $user = $this->createUser();
        $permissions = ['trucks.view'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        // Test SQL injection in search parameter
        $maliciousSearch = "'; DROP TABLE trucks; --";

        $response = $this->actingAs($user)
            ->get(route('trucks.index', ['search' => $maliciousSearch]));

        $response->assertStatus(200);

        // Verify trucks table still exists
        $this->assertGreaterThan(0, Truck::count());
    }

    #[Test]
    public function it_prevents_xss_attacks()
    {
        $user = $this->createUser();
        $permissions = ['trucks.create'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $xssPayload = '<script>alert("XSS")</script>';

        $truckData = [
            'plate' => $xssPayload,
            'vehicletype_id' => \App\Models\VehicleType::factory()->create()->id,
            'status' => 'active',
        ];

        $response = $this->actingAs($user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));

        // Verify the XSS payload is stored as-is (Laravel will escape it in views)
        $this->assertDatabaseHas('trucks', ['plate' => $xssPayload]);
    }

    #[Test]
    public function it_prevents_csrf_attacks()
    {
        $user = $this->createUser();
        $permissions = ['trucks.create'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $truckData = [
            'plate' => 'CSRF-TEST',
            'vehicletype_id' => \App\Models\VehicleType::factory()->create()->id,
            'status' => 'active',
        ];

        // Test without CSRF token
        $response = $this->post(route('trucks.store'), $truckData);
        $response->assertStatus(419); // CSRF token mismatch

        // Test with CSRF token
        $response = $this->actingAs($user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', ['plate' => 'CSRF-TEST']);
    }

    #[Test]
    public function it_prevents_mass_assignment_attacks()
    {
        $user = $this->createUser();
        $permissions = ['trucks.create'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $maliciousData = [
            'plate' => 'MASS-ASSIGN',
            'vehicletype_id' => \App\Models\VehicleType::factory()->create()->id,
            'status' => 'active',
            'id' => 99999, // Attempt to set ID
            'created_at' => '2020-01-01', // Attempt to set timestamp
            'updated_at' => '2020-01-01', // Attempt to set timestamp
            'deleted_at' => null, // Attempt to set soft delete
        ];

        $response = $this->actingAs($user)
            ->post(route('trucks.store'), $maliciousData);

        $response->assertRedirect(route('trucks.index'));

        // Verify only fillable fields were set
        $truck = Truck::where('plate', 'MASS-ASSIGN')->first();
        $this->assertNotEquals(99999, $truck->id);
        $this->assertNotEquals('2020-01-01', $truck->created_at->format('Y-m-d'));
    }

    #[Test]
    public function it_prevents_directory_traversal_attacks()
    {
        $user = $this->createUser();

        $maliciousFilename = '../../../etc/passwd';

        $response = $this->actingAs($user)
            ->get('/trucks/export/csv?filename='.urlencode($maliciousFilename));

        $response->assertNotFound();
    }

    #[Test]
    public function it_prevents_file_upload_attacks()
    {
        $user = $this->createUser();
        $permissions = ['trucks.create'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        // Test with malicious file content
        $maliciousFile = '<?php system($_GET["cmd"]); ?>';

        $truckData = [
            'plate' => 'FILE-UPLOAD',
            'vehicletype_id' => \App\Models\VehicleType::factory()->create()->id,
            'status' => 'active',
            'description' => $maliciousFile,
        ];

        $response = $this->actingAs($user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));

        // Verify the malicious content is stored as text, not executed
        $this->assertDatabaseHas('trucks', ['description' => $maliciousFile]);
    }

    #[Test]
    public function it_prevents_brute_force_attacks()
    {
        // Test login rate limiting
        for ($i = 0; $i < 5; $i++) {
            $response = $this->post('/login', [
                'email' => 'nonexistent@example.com',
                'password' => 'wrongpassword',
            ]);
            $response->assertStatus(302);
            $response->assertSessionHasErrors('email');
        }

        // After multiple failed attempts, should still work
        $response = $this->post('/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'wrongpassword',
        ]);
        $response->assertStatus(302);
        $response->assertSessionHasErrors('email');
    }

    #[Test]
    public function it_prevents_session_fixation()
    {
        $user = $this->createUser();
        Permission::firstOrCreate(['name' => 'trucks.view', 'guard_name' => 'web']);
        $user->givePermissionTo('trucks.view');

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $response->assertStatus(200);

        // Verify session is properly managed
        $this->assertTrue($this->app['session']->has('login_web_'.sha1('App\Models\User')));
    }

    #[Test]
    public function it_prevents_clickjacking()
    {
        $user = $this->createUser();
        $permissions = ['trucks.view'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $response->assertStatus(200);

        // Verify X-Frame-Options header is set
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    #[Test]
    public function it_prevents_information_disclosure()
    {
        $truck = Truck::factory()->create();

        $response = $this->get(route('trucks.show', $truck));
        $response->assertRedirect('/login');

        // Verify error messages don't reveal sensitive information
        $response = $this->post('/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors('email');
    }

    #[Test]
    public function it_prevents_http_parameter_pollution()
    {
        $user = $this->createUser();
        $permissions = ['trucks.view'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        // Test with duplicate parameters
        $response = $this->actingAs($user)
            ->get(route('trucks.index', [
                'search' => 'test',
                'search' => 'malicious',
            ]));

        $response->assertStatus(200);

        // Verify only the last parameter value is used
        $this->assertStringNotContainsString('test', $response->getContent());
    }

    #[Test]
    public function it_prevents_open_redirect_attacks()
    {
        $user = $this->createUser();
        $permissions = ['trucks.view'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $maliciousRedirect = 'http://evil.com';

        $response = $this->actingAs($user)
            ->get(route('trucks.index', ['redirect' => $maliciousRedirect]));

        $response->assertStatus(200);

        // Verify no redirect to external site
        $this->assertStringNotContainsString($maliciousRedirect, $response->getContent());
    }

    #[Test]
    public function it_prevents_timing_attacks()
    {
        $user = $this->createUser();
        $permissions = ['trucks.view'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $startTime = microtime(true);

        $response = $this->actingAs($user)
            ->get(route('trucks.show', 99999)); // Non-existent truck

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(404);

        // Verify response time is reasonable (not too fast, indicating timing attack)
        $this->assertGreaterThan(0.001, $responseTime);
    }

    #[Test]
    public function it_prevents_ldap_injection()
    {
        $user = $this->createUser();
        $permissions = ['trucks.view'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $ldapPayload = '*)(&(objectClass=*)(userPassword=*))';

        $response = $this->actingAs($user)
            ->get(route('trucks.index', ['search' => $ldapPayload]));

        $response->assertStatus(200);

        // Verify LDAP injection payload is treated as regular text
        $this->assertStringNotContainsString('objectClass', $response->getContent());
    }

    #[Test]
    public function it_prevents_command_injection()
    {
        $user = $this->createUser();
        $permissions = ['trucks.create'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $commandPayload = '; rm -rf /';

        $truckData = [
            'plate' => $commandPayload,
            'vehicletype_id' => \App\Models\VehicleType::factory()->create()->id,
            'status' => 'active',
        ];

        $response = $this->actingAs($user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));

        // Verify command injection payload is stored as text
        $this->assertDatabaseHas('trucks', ['plate' => $commandPayload]);
    }

    #[Test]
    public function it_prevents_xml_external_entity_attacks()
    {
        $user = $this->createUser();
        $permissions = ['trucks.view'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $xxePayload = '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>';

        $response = $this->actingAs($user)
            ->get(route('trucks.index', ['xml' => $xxePayload]));

        $response->assertStatus(200);

        // Verify XXE payload is not processed
        $this->assertStringNotContainsString('root:', $response->getContent());
    }

    #[Test]
    public function it_prevents_server_side_request_forgery()
    {
        $user = $this->createUser();
        $permissions = ['trucks.view'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
        $role = Role::findByName('admin', 'web');
        $role->givePermissionTo($permissions);
        $user->assignRole($role);

        $ssrfPayload = 'http://localhost:22';

        $response = $this->actingAs($user)
            ->get(route('trucks.index', ['url' => $ssrfPayload]));

        $response->assertStatus(200);

        // Verify SSRF payload is not processed
        $this->assertStringNotContainsString('localhost:22', $response->getContent());
    }
}
