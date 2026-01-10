<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverNotificationController extends Controller
{
    /**
     * Get driver notifications
     * Uses the authenticated User's notifications (since drivers are linked to users via user_id)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $limit = min((int) $request->query('limit', 50), 100);
        $unreadOnly = $request->query('unread_only', false) === 'true' || $request->query('unread_only') === true;

        // Get notifications using Laravel's Notifiable trait
        $query = $user->notifications()->orderByDesc('created_at');

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        $notifications = $query->limit($limit)->get()->map(function ($notification) {
            return $this->formatNotification($notification);
        });

        // Get unread count
        $unreadCount = $user->unreadNotifications()->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        // Find the notification
        $notification = $user->notifications()->where('id', $id)->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        }

        // Mark as read
        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => $this->formatNotification($notification),
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Format notification data
     */
    private function formatNotification($notification): array
    {
        $data = $notification->data ?? [];

        return [
            'id' => $notification->id,
            'type' => $data['type'] ?? $notification->type ?? 'unknown',
            'title' => $data['title'] ?? 'Notification',
            'message' => $data['message'] ?? '',
            'payload' => $data['payload'] ?? [],
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at->toIso8601String(),
        ];
    }
}
