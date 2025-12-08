<?php

namespace Tests\Feature;

use App\Exports\ActivityLogExport;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class ActivityLogControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2025-01-01 10:00:00')); // Keep exports deterministic

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, ['activity-logs.view', 'activity-logs.show', 'activity-logs.export']);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_user_without_permission_cannot_access_activity_log_index(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('activity-logs.index'))
            ->assertForbidden();
    }

    public function test_index_lists_activity_logs_with_filters(): void
    {
        $truck = Truck::factory()->create();

        $matching = $this->createActivity([
            'subject_type' => $truck::class,
            'subject_id' => $truck->id,
            'log_name' => 'trucks',
            'event' => 'updated',
            'description' => 'Truck updated',
            'created_at' => Carbon::now()->subHours(2),
        ]);

        // Noise entry - should be filtered out
        $this->createActivity([
            'event' => 'created',
            'description' => 'Ignore me',
            'created_at' => Carbon::now()->subDays(10),
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('activity-logs.index', [
                'action' => 'updated',
                'causer_id' => $this->user->id,
                'from' => Carbon::now()->subDay()->toDateString(),
                'sort' => 'created_at',
                'direction' => 'desc',
            ]));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ActivityLogs/Index')
                ->where('filters.action', 'updated')
                ->where('filters.causer_id', (string) $this->user->id)
                ->where('logs.data.0.id', $matching->id)
                ->where('logs.data.0.causer_id', $this->user->id)
                ->where('logs.data.0.subject_id', $truck->id)
                ->has('filterOptions.users')
                ->has('filterOptions.actions'));
    }

    public function test_show_displays_activity_details(): void
    {
        $truck = Truck::factory()->create(['plate' => 'ABC-123']);

        $activity = $this->createActivity([
            'subject_type' => $truck::class,
            'subject_id' => $truck->id,
            'log_name' => 'trucks',
            'event' => 'updated',
            'description' => 'Truck updated',
            'properties' => [
                'old' => ['plate' => 'OLD-111'],
                'attributes' => ['plate' => 'ABC-123'],
            ],
        ]);

        $this->actingAs($this->user)
            ->get(route('activity-logs.show', $activity))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ActivityLogs/Show')
                ->where('activity.id', $activity->id)
                ->where('activity.causer.id', $this->user->id)
                ->where('activity.subject.id', $truck->id)
                ->where('activity.properties.new.plate', 'ABC-123')
                ->where('activity.changed_fields.0', 'plate'));
    }

    public function test_excel_export_uses_applied_filters(): void
    {
        Excel::fake();

        $matching = $this->createActivity([
            'event' => 'updated',
            'description' => 'Matches export',
        ]);

        $this->createActivity([
            'event' => 'deleted',
            'description' => 'Should not export',
        ]);

        $fileName = 'activity-logs-'.Carbon::now()->format('Ymd_His').'.xlsx';

        $this->actingAs($this->user)
            ->get(route('activity-logs.export-excel', ['action' => 'updated']))
            ->assertOk();

        Excel::assertDownloaded($fileName, function (ActivityLogExport $export) use ($matching) {
            $query = $export->query();

            $this->assertSame($matching->id, $query->first()->id);

            return true;
        });
    }

    public function test_csv_export_is_authorized(): void
    {
        Excel::fake();

        $fileName = 'activity-logs-'.Carbon::now()->format('Ymd_His').'.csv';

        $this->actingAs($this->user)
            ->get(route('activity-logs.export-csv'))
            ->assertOk();

        Excel::assertDownloaded($fileName);
    }

    private function createActivity(array $attributes = []): Activity
    {
        $subjectId = Arr::get($attributes, 'subject_id');
        $subjectType = Arr::get($attributes, 'subject_type');

        if (! $subjectId || ! $subjectType) {
            $truck = Truck::factory()->create();
            $attributes['subject_type'] = $truck::class;
            $attributes['subject_id'] = $truck->id;
        }

        $defaults = [
            'log_name' => 'system',
            'event' => 'updated',
            'description' => 'System update',
            'subject_type' => $attributes['subject_type'],
            'subject_id' => $attributes['subject_id'],
            'causer_id' => Arr::get($attributes, 'causer_id', $this->user->id),
            'causer_type' => User::class,
            'properties' => $attributes['properties'] ?? [
                'old' => ['status' => 'draft'],
                'attributes' => ['status' => 'published'],
            ],
            'created_at' => Arr::get($attributes, 'created_at', Carbon::now()),
            'updated_at' => Arr::get($attributes, 'updated_at', Arr::get($attributes, 'created_at', Carbon::now())),
        ];

        $payload = array_merge($defaults, Arr::except($attributes, ['properties']));

        return Activity::query()->create($payload);
    }
}
