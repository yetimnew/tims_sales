<?php

namespace Tests\Feature\Notifications;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationFeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_paginated_notifications_for_authenticated_user(): void
    {
        $user = User::factory()->create();

        foreach (range(1, 12) as $index) {
            $this->createNotification($user, [
                'title' => "Notification {$index}",
                'type' => 'truck.created',
            ], $index <= 3, $index);
        }

        $response = $this->actingAs($user)->getJson(route('notifications.feed', ['per_page' => 5]));

        $response
            ->assertOk()
            ->assertJsonPath('unread_count', 9)
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.has_more', true)
            ->assertJsonPath('meta.next_page', 2);

        $data = $response->json('data');

        $this->assertIsArray($data);
        $this->assertCount(5, $data);
        $this->assertSame('Notification 1', $data[0]['data']['title']);
        $this->assertSame('Notification 5', $data[4]['data']['title']);
    }

    public function test_it_returns_unauthorized_for_guests(): void
    {
        $response = $this->getJson(route('notifications.feed'));

        $response->assertUnauthorized();
    }

    public function test_it_clamps_page_and_limit_inputs(): void
    {
        $user = User::factory()->create();

        foreach (range(1, 70) as $index) {
            $this->createNotification($user, [
                'title' => "Bulk {$index}",
                'type' => 'truck.created',
            ], false, $index);
        }

        $response = $this->actingAs($user)->getJson(route('notifications.feed', [
            'per_page' => 200,
            'page' => -5,
        ]));

        $response
            ->assertOk()
            ->assertJsonPath('meta.per_page', 50)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.has_more', true)
            ->assertJsonPath('meta.previous_page', null);
    }

    private function createNotification(User $user, array $data, bool $read, int $minutesAgo): void
    {
        $timestamp = Carbon::now()->subMinutes($minutesAgo);

        /** @var DatabaseNotification $notification */
        $notification = $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => 'App\\Notifications\\TruckLifecycleNotification',
            'data' => $data,
        ]);

        $notification->forceFill([
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
            'read_at' => $read ? $timestamp : null,
        ])->save();
    }
}
