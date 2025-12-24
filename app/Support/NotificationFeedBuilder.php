<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationFeedBuilder
{
    public function summary(User $user, int $limit = 8): array
    {
        $notifications = $user->notifications()
            ->latest()
            ->limit($this->normalizeLimit($limit))
            ->get();

        return [
            'unread_count' => (int) $user->unreadNotifications()->count(),
            'recent' => $this->transformCollection($notifications),
        ];
    }

    public function paginate(User $user, int $perPage, int $page): array
    {
        $paginator = $user->notifications()
            ->latest()
            ->paginate(
                $this->normalizeLimit($perPage, 50),
                ['*'],
                'page',
                max($page, 1)
            );

        return [
            'unread_count' => (int) $user->unreadNotifications()->count(),
            'data' => $this->transformCollection($paginator->getCollection()),
            'meta' => $this->transformPaginator($paginator),
        ];
    }

    /**
     * @param  iterable<int, DatabaseNotification>  $notifications
     * @return array<int, array<string, mixed>>
     */
    public function transformCollection(iterable $notifications): array
    {
        $items = [];

        foreach ($notifications as $notification) {
            $items[] = $this->transformNotification($notification);
        }

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    public function transformNotification(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => class_basename($notification->type),
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at?->toIso8601String(),
            'data' => $notification->data ?? [],
        ];
    }

    /**
     * @return array<string, int|bool|null>
     */
    private function transformPaginator(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
            'has_more' => $paginator->hasMorePages(),
            'next_page' => $paginator->hasMorePages() ? $paginator->currentPage() + 1 : null,
            'previous_page' => $paginator->currentPage() > 1 ? $paginator->currentPage() - 1 : null,
        ];
    }

    private function normalizeLimit(int $value, int $max = 20): int
    {
        return min(max($value, 1), $max);
    }
}
