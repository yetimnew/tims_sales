<?php

namespace Tests\Feature\Audit;

use App\Models\User;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditTest extends TestCase
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
            'audit.view', 'audit.create', 'audit.edit', 'audit.destroy',
            'audit.show', 'audit.store', 'audit.update', 'audit.export',
            'audit.filter', 'audit.search', 'audit.download'
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create role and assign permissions
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $role->givePermissionTo($permissions);
        $this->user->assignRole($role);
    }

    /** @test */
    public function user_can_view_audit_logs()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Index')
            ->has('auditLogs')
        );
    }

    /** @test */
    public function user_can_view_audit_log_details()
    {
        $auditLog = \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Truck',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Test Truck'],
            'url' => '/trucks',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);

        $response = $this->actingAs($this->user)
            ->get('/audit/' . $auditLog->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Show')
            ->has('auditLog')
        );
    }

    /** @test */
    public function user_can_search_audit_logs()
    {
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Truck',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Important Truck'],
            'url' => '/trucks',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'updated',
            'auditable_type' => 'App\Models\Driver',
            'auditable_id' => 1,
            'old_values' => ['name' => 'Old Driver'],
            'new_values' => ['name' => 'Regular Driver'],
            'url' => '/drivers',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);

        $response = $this->actingAs($this->user)
            ->get('/audit?search=Important');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Index')
            ->has('auditLogs.data', 1)
        );
    }

    /** @test */
    public function user_can_filter_audit_logs_by_event()
    {
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Truck',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Test Truck'],
            'url' => '/trucks',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'updated',
            'auditable_type' => 'App\Models\Driver',
            'auditable_id' => 1,
            'old_values' => ['name' => 'Old Driver'],
            'new_values' => ['name' => 'New Driver'],
            'url' => '/drivers',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);

        $response = $this->actingAs($this->user)
            ->get('/audit?event=created');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Index')
            ->has('auditLogs.data', 1)
        );
    }

    /** @test */
    public function user_can_filter_audit_logs_by_model()
    {
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Truck',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Test Truck'],
            'url' => '/trucks',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Driver',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Test Driver'],
            'url' => '/drivers',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);

        $response = $this->actingAs($this->user)
            ->get('/audit?model=Truck');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Index')
            ->has('auditLogs.data', 1)
        );
    }

    /** @test */
    public function user_can_filter_audit_logs_by_user()
    {
        $otherUser = User::factory()->create();

        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Truck',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Test Truck'],
            'url' => '/trucks',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);
        \App\Models\AuditLog::create([
            'user_id' => $otherUser->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Driver',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Test Driver'],
            'url' => '/drivers',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);

        $response = $this->actingAs($this->user)
            ->get('/audit?user_id=' . $this->user->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Index')
            ->has('auditLogs.data', 1)
        );
    }

    /** @test */
    public function user_can_filter_audit_logs_by_date_range()
    {
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Truck',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Old Truck'],
            'url' => '/trucks',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0',
            'created_at' => now()->subMonth()
        ]);
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Driver',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Recent Driver'],
            'url' => '/drivers',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0',
            'created_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->get('/audit?start_date=' . now()->subWeek()->format('Y-m-d') . '&end_date=' . now()->format('Y-m-d'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Index')
            ->has('auditLogs.data', 1)
        );
    }

    /** @test */
    public function user_can_sort_audit_logs()
    {
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Truck',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'First Truck'],
            'url' => '/trucks',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0',
            'created_at' => now()->subHour()
        ]);
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Driver',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Second Driver'],
            'url' => '/drivers',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0',
            'created_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->get('/audit?sort=created_at&direction=desc');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Index')
            ->has('auditLogs.data', 2)
        );
    }

    /** @test */
    public function user_can_paginate_audit_logs()
    {
        // Create 25 audit logs
        for ($i = 1; $i <= 25; $i++) {
            \App\Models\AuditLog::create([
                'user_id' => $this->user->id,
                'event' => 'created',
                'auditable_type' => 'App\Models\Truck',
                'auditable_id' => $i,
                'old_values' => [],
                'new_values' => ['name' => "Truck {$i}"],
                'url' => '/trucks',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0'
            ]);
        }

        $response = $this->actingAs($this->user)
            ->get('/audit?page=2');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Index')
            ->has('auditLogs.data', 5)
            ->where('auditLogs.meta.current_page', 2)
        );
    }

    /** @test */
    public function user_can_export_audit_logs()
    {
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Truck',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Test Truck'],
            'url' => '/trucks',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);

        $response = $this->actingAs($this->user)
            ->get('/audit/export');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    /** @test */
    public function user_can_view_audit_statistics()
    {
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Truck',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Test Truck'],
            'url' => '/trucks',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0'
        ]);

        $response = $this->actingAs($this->user)
            ->get('/audit/statistics');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Statistics')
            ->has('statistics')
        );
    }

    /** @test */
    public function user_can_view_audit_dashboard()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Dashboard')
            ->has('dashboard')
        );
    }

    /** @test */
    public function user_can_view_audit_charts()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit/charts');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Charts')
            ->has('charts')
        );
    }

    /** @test */
    public function user_can_view_audit_reports()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit/reports');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Reports')
            ->has('reports')
        );
    }

    /** @test */
    public function user_can_generate_audit_report()
    {
        $response = $this->actingAs($this->user)
            ->post('/audit/reports/generate', [
                'start_date' => '2023-01-01',
                'end_date' => '2023-12-31',
                'type' => 'summary'
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_download_audit_report()
    {
        $report = \App\Models\AuditReport::create([
            'name' => 'Test Audit Report',
            'type' => 'summary',
            'data' => ['test' => 'data'],
            'generated_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->get('/audit/reports/' . $report->id . '/download');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    /** @test */
    public function user_can_view_audit_alerts()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit/alerts');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Alerts')
            ->has('alerts')
        );
    }

    /** @test */
    public function user_can_create_audit_alert()
    {
        $response = $this->actingAs($this->user)
            ->post('/audit/alerts', [
                'name' => 'Test Alert',
                'event' => 'created',
                'model' => 'Truck',
                'conditions' => [
                    'field' => 'name',
                    'operator' => 'contains',
                    'value' => 'Test'
                ],
                'notification_method' => 'email',
                'notification_recipients' => ['test@example.com']
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('audit_alerts', [
            'name' => 'Test Alert',
            'event' => 'created',
            'model' => 'Truck'
        ]);
    }

    /** @test */
    public function user_can_edit_audit_alert()
    {
        $alert = \App\Models\AuditAlert::create([
            'name' => 'Test Alert',
            'event' => 'created',
            'model' => 'Truck',
            'conditions' => ['test' => 'data'],
            'notification_method' => 'email',
            'notification_recipients' => ['test@example.com']
        ]);

        $response = $this->actingAs($this->user)
            ->put('/audit/alerts/' . $alert->id, [
                'name' => 'Updated Alert',
                'event' => 'updated',
                'model' => 'Driver',
                'conditions' => [
                    'field' => 'name',
                    'operator' => 'equals',
                    'value' => 'Updated'
                ],
                'notification_method' => 'sms',
                'notification_recipients' => ['updated@example.com']
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('audit_alerts', [
            'id' => $alert->id,
            'name' => 'Updated Alert',
            'event' => 'updated',
            'model' => 'Driver'
        ]);
    }

    /** @test */
    public function user_can_delete_audit_alert()
    {
        $alert = \App\Models\AuditAlert::create([
            'name' => 'Test Alert',
            'event' => 'created',
            'model' => 'Truck',
            'conditions' => ['test' => 'data'],
            'notification_method' => 'email',
            'notification_recipients' => ['test@example.com']
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/audit/alerts/' . $alert->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('audit_alerts', [
            'id' => $alert->id
        ]);
    }

    /** @test */
    public function user_can_view_audit_settings()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit/settings');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Settings')
            ->has('settings')
        );
    }

    /** @test */
    public function user_can_update_audit_settings()
    {
        $response = $this->actingAs($this->user)
            ->put('/audit/settings', [
                'retention_days' => 365,
                'log_level' => 'info',
                'enabled_models' => ['Truck', 'Driver'],
                'excluded_fields' => ['password', 'remember_token'],
                'ip_logging' => true,
                'user_agent_logging' => true
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_view_audit_models()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit/models');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Models')
            ->has('models')
        );
    }

    /** @test */
    public function user_can_enable_audit_for_model()
    {
        $response = $this->actingAs($this->user)
            ->post('/audit/models', [
                'model' => 'Truck',
                'enabled' => true,
                'events' => ['created', 'updated', 'deleted'],
                'fields' => ['name', 'description', 'status']
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('audit_model_settings', [
            'model' => 'Truck',
            'enabled' => true
        ]);
    }

    /** @test */
    public function user_can_disable_audit_for_model()
    {
        \App\Models\AuditModelSetting::create([
            'model' => 'Truck',
            'enabled' => true,
            'events' => ['created', 'updated', 'deleted'],
            'fields' => ['name', 'description', 'status']
        ]);

        $response = $this->actingAs($this->user)
            ->put('/audit/models/Truck', [
                'enabled' => false
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('audit_model_settings', [
            'model' => 'Truck',
            'enabled' => false
        ]);
    }

    /** @test */
    public function user_can_view_audit_cleanup()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit/cleanup');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Cleanup')
            ->has('cleanup')
        );
    }

    /** @test */
    public function user_can_cleanup_old_audit_logs()
    {
        // Create old audit logs
        \App\Models\AuditLog::create([
            'user_id' => $this->user->id,
            'event' => 'created',
            'auditable_type' => 'App\Models\Truck',
            'auditable_id' => 1,
            'old_values' => [],
            'new_values' => ['name' => 'Old Truck'],
            'url' => '/trucks',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0',
            'created_at' => now()->subYear()
        ]);

        $response = $this->actingAs($this->user)
            ->post('/audit/cleanup', [
                'retention_days' => 365
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_view_audit_backup()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit/backup');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Backup')
            ->has('backup')
        );
    }

    /** @test */
    public function user_can_backup_audit_logs()
    {
        $response = $this->actingAs($this->user)
            ->post('/audit/backup', [
                'format' => 'csv',
                'start_date' => '2023-01-01',
                'end_date' => '2023-12-31'
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_restore_audit_logs()
    {
        $backup = \App\Models\AuditBackup::create([
            'filename' => 'test-backup.csv',
            'format' => 'csv',
            'size' => 1024,
            'created_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->post('/audit/backup/' . $backup->id . '/restore');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_view_audit_permissions()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit/permissions');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Permissions')
            ->has('permissions')
        );
    }

    /** @test */
    public function user_can_assign_audit_permissions()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->user)
            ->post('/audit/permissions', [
                'user_id' => $user->id,
                'permissions' => ['audit.view', 'audit.export']
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_view_audit_api()
    {
        $response = $this->actingAs($this->user)
            ->get('/audit/api');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Audit/Api')
            ->has('api')
        );
    }

    /** @test */
    public function user_can_generate_audit_api_key()
    {
        $response = $this->actingAs($this->user)
            ->post('/audit/api/generate-key');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_revoke_audit_api_key()
    {
        $apiKey = \App\Models\AuditApiKey::create([
            'user_id' => $this->user->id,
            'name' => 'Test API Key',
            'key' => 'test-key',
            'permissions' => ['audit.view']
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/audit/api/keys/' . $apiKey->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('audit_api_keys', [
            'id' => $apiKey->id
        ]);
    }
}
