<?php

namespace Tests\Feature\Performance;

use App\Models\Performance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class EditDispatchDateTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, ['performances.update', 'performances.view-any']);
    }

    #[Test]
    public function it_formats_dispatch_and_return_dates_for_datetime_local_inputs(): void
    {
        $dispatchAt = Carbon::create(2024, 12, 25, 14, 45, 0);
        $returnedAt = Carbon::create(2024, 12, 28, 9, 15, 0);

        $performance = Performance::factory()->create([
            'DateDispach' => $dispatchAt,
            'returned_date' => $returnedAt,
            'satus' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('performances.edit', $performance));

        $response->assertStatus(200);

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Performances/Edit')
            ->where('performance.DateDispach', $dispatchAt->format('Y-m-d\TH:i'))
            ->where('performance.returned_date', $returnedAt->format('Y-m-d\TH:i'))
        );
    }
}
