<?php

namespace Tests\Feature\Report;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ReportTest extends TestCase
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
            'reports.view', 'reports.create', 'reports.edit', 'reports.destroy',
            'reports.show', 'reports.store', 'reports.update', 'reports.export',
            'reports.generate', 'reports.download', 'reports.schedule',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create role and assign permissions
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $role->givePermissionTo($permissions);
        $this->user->assignRole($role);
    }

    #[Test]
    public function user_can_view_reports_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/reports');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Index')
            ->has('reports')
        );
    }

    #[Test]
    public function user_can_create_report()
    {
        $response = $this->actingAs($this->user)
            ->post('/reports', [
                'name' => 'Test Report',
                'type' => 'summary',
                'description' => 'Test report description',
                'parameters' => [
                    'start_date' => '2023-01-01',
                    'end_date' => '2023-12-31',
                ],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('reports', [
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
        ]);
    }

    #[Test]
    public function user_can_view_report()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports/'.$report->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Show')
            ->has('report')
        );
    }

    #[Test]
    public function user_can_edit_report()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports/'.$report->id.'/edit');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Edit')
            ->has('report')
        );
    }

    #[Test]
    public function user_can_update_report()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->put('/reports/'.$report->id, [
                'name' => 'Updated Report',
                'type' => 'detailed',
                'description' => 'Updated report description',
                'parameters' => [
                    'start_date' => '2023-01-01',
                    'end_date' => '2023-12-31',
                ],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'name' => 'Updated Report',
            'type' => 'detailed',
            'description' => 'Updated report description',
        ]);
    }

    #[Test]
    public function user_can_delete_report()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/reports/'.$report->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('reports', [
            'id' => $report->id,
        ]);
    }

    #[Test]
    public function user_can_generate_report()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->post('/reports/'.$report->id.'/generate');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function user_can_download_report()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
            'generated_at' => now(),
            'file_path' => 'reports/test-report.pdf',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports/'.$report->id.'/download');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    #[Test]
    public function user_can_schedule_report()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->post('/reports/'.$report->id.'/schedule', [
                'frequency' => 'weekly',
                'day_of_week' => 'monday',
                'time' => '09:00',
                'email_recipients' => ['test@example.com'],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function user_can_view_report_templates()
    {
        $response = $this->actingAs($this->user)
            ->get('/reports/templates');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Templates')
            ->has('templates')
        );
    }

    #[Test]
    public function user_can_create_report_template()
    {
        $response = $this->actingAs($this->user)
            ->post('/reports/templates', [
                'name' => 'Test Template',
                'type' => 'summary',
                'description' => 'Test template description',
                'parameters' => [
                    'start_date' => '2023-01-01',
                    'end_date' => '2023-12-31',
                ],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('report_templates', [
            'name' => 'Test Template',
            'type' => 'summary',
            'description' => 'Test template description',
        ]);
    }

    #[Test]
    public function user_can_edit_report_template()
    {
        $template = \App\Models\ReportTemplate::create([
            'name' => 'Test Template',
            'type' => 'summary',
            'description' => 'Test template description',
            'parameters' => ['test' => 'data'],
        ]);

        $response = $this->actingAs($this->user)
            ->put('/reports/templates/'.$template->id, [
                'name' => 'Updated Template',
                'type' => 'detailed',
                'description' => 'Updated template description',
                'parameters' => [
                    'start_date' => '2023-01-01',
                    'end_date' => '2023-12-31',
                ],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('report_templates', [
            'id' => $template->id,
            'name' => 'Updated Template',
            'type' => 'detailed',
            'description' => 'Updated template description',
        ]);
    }

    #[Test]
    public function user_can_delete_report_template()
    {
        $template = \App\Models\ReportTemplate::create([
            'name' => 'Test Template',
            'type' => 'summary',
            'description' => 'Test template description',
            'parameters' => ['test' => 'data'],
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/reports/templates/'.$template->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('report_templates', [
            'id' => $template->id,
        ]);
    }

    #[Test]
    public function user_can_view_report_categories()
    {
        $response = $this->actingAs($this->user)
            ->get('/reports/categories');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Categories')
            ->has('categories')
        );
    }

    #[Test]
    public function user_can_create_report_category()
    {
        $response = $this->actingAs($this->user)
            ->post('/reports/categories', [
                'name' => 'Test Category',
                'description' => 'Test category description',
                'color' => '#FF0000',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('report_categories', [
            'name' => 'Test Category',
            'description' => 'Test category description',
            'color' => '#FF0000',
        ]);
    }

    #[Test]
    public function user_can_edit_report_category()
    {
        $category = \App\Models\ReportCategory::create([
            'name' => 'Test Category',
            'description' => 'Test category description',
            'color' => '#FF0000',
        ]);

        $response = $this->actingAs($this->user)
            ->put('/reports/categories/'.$category->id, [
                'name' => 'Updated Category',
                'description' => 'Updated category description',
                'color' => '#00FF00',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('report_categories', [
            'id' => $category->id,
            'name' => 'Updated Category',
            'description' => 'Updated category description',
            'color' => '#00FF00',
        ]);
    }

    #[Test]
    public function user_can_delete_report_category()
    {
        $category = \App\Models\ReportCategory::create([
            'name' => 'Test Category',
            'description' => 'Test category description',
            'color' => '#FF0000',
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/reports/categories/'.$category->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('report_categories', [
            'id' => $category->id,
        ]);
    }

    #[Test]
    public function user_can_view_report_analytics()
    {
        $response = $this->actingAs($this->user)
            ->get('/reports/analytics');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Analytics')
            ->has('analytics')
        );
    }

    #[Test]
    public function user_can_view_report_dashboard()
    {
        $response = $this->actingAs($this->user)
            ->get('/reports/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Dashboard')
            ->has('dashboard')
        );
    }

    #[Test]
    public function user_can_export_reports()
    {
        $response = $this->actingAs($this->user)
            ->get('/reports/export');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    #[Test]
    public function user_can_search_reports()
    {
        \App\Models\Report::create([
            'name' => 'Important Report',
            'type' => 'summary',
            'description' => 'Important report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);
        \App\Models\Report::create([
            'name' => 'Regular Report',
            'type' => 'summary',
            'description' => 'Regular report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports?search=Important');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Index')
            ->has('reports.data', 1)
        );
    }

    #[Test]
    public function user_can_sort_reports()
    {
        \App\Models\Report::create([
            'name' => 'First Report',
            'type' => 'summary',
            'description' => 'First report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
            'created_at' => now()->subHour(),
        ]);
        \App\Models\Report::create([
            'name' => 'Second Report',
            'type' => 'summary',
            'description' => 'Second report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports?sort=created_at&direction=desc');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Index')
            ->has('reports.data', 2)
        );
    }

    #[Test]
    public function user_can_paginate_reports()
    {
        // Create 25 reports
        for ($i = 1; $i <= 25; $i++) {
            \App\Models\Report::create([
                'name' => "Report {$i}",
                'type' => 'summary',
                'description' => "Report {$i} description",
                'parameters' => ['test' => 'data'],
                'user_id' => $this->user->id,
            ]);
        }

        $response = $this->actingAs($this->user)
            ->get('/reports?page=2');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Index')
            ->has('reports.data', 5)
            ->where('reports.meta.current_page', 2)
        );
    }

    #[Test]
    public function user_can_filter_reports_by_type()
    {
        \App\Models\Report::create([
            'name' => 'Summary Report',
            'type' => 'summary',
            'description' => 'Summary report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);
        \App\Models\Report::create([
            'name' => 'Detailed Report',
            'type' => 'detailed',
            'description' => 'Detailed report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports?type=summary');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Index')
            ->has('reports.data', 1)
        );
    }

    #[Test]
    public function user_can_filter_reports_by_category()
    {
        $category = \App\Models\ReportCategory::create([
            'name' => 'Test Category',
            'description' => 'Test category description',
            'color' => '#FF0000',
        ]);

        \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
            'category_id' => $category->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports?category_id='.$category->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Index')
            ->has('reports.data', 1)
        );
    }

    #[Test]
    public function user_can_filter_reports_by_date_range()
    {
        \App\Models\Report::create([
            'name' => 'Old Report',
            'type' => 'summary',
            'description' => 'Old report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
            'created_at' => now()->subMonth(),
        ]);
        \App\Models\Report::create([
            'name' => 'Recent Report',
            'type' => 'summary',
            'description' => 'Recent report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports?start_date='.now()->subWeek()->format('Y-m-d').'&end_date='.now()->format('Y-m-d'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Index')
            ->has('reports.data', 1)
        );
    }

    #[Test]
    public function user_can_view_report_history()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports/'.$report->id.'/history');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/History')
            ->has('history')
        );
    }

    #[Test]
    public function user_can_view_report_permissions()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports/'.$report->id.'/permissions');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Permissions')
            ->has('permissions')
        );
    }

    #[Test]
    public function user_can_assign_report_permissions()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($this->user)
            ->post('/reports/'.$report->id.'/permissions', [
                'user_id' => $user->id,
                'permission' => 'view',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function user_can_view_report_sharing()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports/'.$report->id.'/sharing');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Sharing')
            ->has('sharing')
        );
    }

    #[Test]
    public function user_can_share_report()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->post('/reports/'.$report->id.'/share', [
                'email' => 'test@example.com',
                'message' => 'Check out this report',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function user_can_view_report_comments()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports/'.$report->id.'/comments');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Comments')
            ->has('comments')
        );
    }

    #[Test]
    public function user_can_add_report_comment()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->post('/reports/'.$report->id.'/comments', [
                'comment' => 'This is a test comment',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('report_comments', [
            'report_id' => $report->id,
            'user_id' => $this->user->id,
            'comment' => 'This is a test comment',
        ]);
    }

    #[Test]
    public function user_can_view_report_versions()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports/'.$report->id.'/versions');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Versions')
            ->has('versions')
        );
    }

    #[Test]
    public function user_can_restore_report_version()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $version = \App\Models\ReportVersion::create([
            'report_id' => $report->id,
            'version' => 1,
            'data' => ['old_data' => 'value'],
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->post('/reports/'.$report->id.'/versions/'.$version->id.'/restore');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function user_can_view_report_audit_trail()
    {
        $report = \App\Models\Report::create([
            'name' => 'Test Report',
            'type' => 'summary',
            'description' => 'Test report description',
            'parameters' => ['test' => 'data'],
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get('/reports/'.$report->id.'/audit-trail');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/AuditTrail')
            ->has('auditTrail')
        );
    }
}
