# 🚀 TIMS - Shared Hosting Setup (NO WEBSOCKETS NEEDED)

## ✅ Your Notifications ARE Working!

Your system uses **database polling** which works perfectly on ANY shared hosting. No WebSockets needed!

---

## 🔧 Quick Setup

### 1. Configure .env
```bash
# IMPORTANT: Set these
BROADCAST_CONNECTION=null
QUEUE_CONNECTION=database
VITE_NOTIFICATIONS_POLL_INTERVAL=30000
```

### 2. Run Migrations
```bash
php artisan migrate
```

### 3. Seed Notification Types
```bash
php artisan db:seed --class=NotificationTypeSeeder
```

### 4. Done! 🎉

That's it! Your notifications will work via database polling every 30 seconds.

---

## 📊 How It Works

```
User Action (e.g., Create Truck)
    ↓
Event Dispatched → Listener Triggered
    ↓
Notification Saved to Database
    ↓
Frontend Polls API Every 30 Seconds
    ↓
Notification Bell Updates Automatically
```

**No WebSockets. No Pusher. No Problems.** ✅

---

## ⚙️ Adjust Polling Speed

In `.env`:
```bash
# Fast (20 seconds)
VITE_NOTIFICATIONS_POLL_INTERVAL=20000

# Normal (30 seconds) - Recommended
VITE_NOTIFICATIONS_POLL_INTERVAL=30000

# Slow (60 seconds)
VITE_NOTIFICATIONS_POLL_INTERVAL=60000
```

Then rebuild frontend:
```bash
npm run build
```

---

## 🧪 Test It

### Create a test notification:
```bash
php artisan tinker
```

```php
$user = \App\Models\User::first();
$type = \App\Models\NotificationType::where('key', 'trucks.created')->first();

$user->notify(
    new \App\Notifications\TruckLifecycleNotification(
        $type,
        'Test Notification',
        'Your notifications are working!',
        ['test' => true]
    )
);
```

Check your browser - notification appears within 30 seconds!

---

## 🔥 Production Deployment

### 1. Build Frontend
```bash
npm run build
```

### 2. Clear Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### 3. Run Queue Worker (if available)
```bash
php artisan queue:work --daemon
```

If your host doesn't support queue workers, notifications still work (just might be slightly slower).

---

## ✅ What's Working

- ✅ Database notifications
- ✅ Automatic polling (30s)
- ✅ Notification bell with badge
- ✅ Mark as read
- ✅ User preferences
- ✅ 63 lifecycle events tracked
- ✅ Works on ANY shared hosting

---

## 🎯 Performance Tips

1. **Enable OPcache** (ask your host)
2. **Use database caching** (already configured)
3. **Keep polling at 30s** (good balance)
4. **Enable queue workers** if your host allows

---

## 🆘 Troubleshooting

**Notifications not appearing?**
```bash
# 1. Check database
php artisan tinker
\App\Models\User::first()->notifications;

# 2. Check notification types exist
\App\Models\NotificationType::all();

# 3. Clear everything
php artisan config:clear && php artisan cache:clear
```

**Still not working?**
Check `storage/logs/laravel.log` for errors.

---

## 💡 Need Instant Notifications?

If you upgrade to a VPS/dedicated server later, you can add WebSockets. But for now, **30-second polling is perfectly fine** for most use cases!

---

Your notification system is **production-ready** right now! 🚀

