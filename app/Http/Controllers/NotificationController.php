<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        // Page uses shared props from HandleInertiaRequests
        return Inertia::render('Notifications/Index');
    }

    public function markAsRead(Request $request, string $notificationId)
    {
        $user = $request->user();
        if ($user === null) {
            return redirect()->route('home');
        }

        $notification = $user->notifications()->where('id', $notificationId)->first();
        if ($notification) {
            $notification->markAsRead();
        }

        return back()->with('success', 'Notification marked as read');
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        if ($user === null) {
            return redirect()->route('home');
        }

        $user->unreadNotifications->markAsRead();

        return back()->with('success', 'All notifications marked as read');
    }
}
