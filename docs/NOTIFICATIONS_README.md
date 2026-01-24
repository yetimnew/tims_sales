# 🔔 TIMS Notifications - Shared Hosting (NO WebSockets)

## ✅ Your System Works RIGHT NOW

No setup needed! Notifications work via **database + polling**. Compatible with ALL shared hosting.

---

## 🧪 Test It

```bash
# Send test notification
php artisan notifications:test

# Or to specific user
php artisan notifications:test --user=1
```

Open your browser → notification appears within 30 seconds! ✨

---

## ⚙️ Configure (.env)

```bash
# Set these
BROADCAST_CONNECTION=null
QUEUE_CONNECTION=database

# Adjust polling speed (milliseconds)
VITE_NOTIFICATIONS_POLL_INTERVAL=30000  # 30 seconds (recommended)
```

After changing, rebuild:
```bash
npm run build
```

---

## 📖 How Events Work

### When something happens:

1. **Dispatch Event** in your controller:
```php
use App\Events\TruckCreated;

TruckCreated::dispatch($truck, auth()->user());
```

2. **Listener Catches It** (auto-configured in `app/Listeners/`)

3. **Notification Sent** to database

4. **Frontend Polls** API every 30s

5. **Bell Updates** automatically!

---

## 🎯 All Events Already Working

Your system tracks **63 lifecycle events**:
- ✅ Trucks (create/update/delete)
- ✅ Drivers (create/update/delete)
- ✅ Performances (create/update/delete)
- ✅ Operations, Customers, Fuel Records, etc.

**They all work automatically!** No extra setup needed.

---

## 🐛 Troubleshooting

### Notifications not appearing?

```bash
# 1. Check database
php artisan tinker
User::first()->unreadNotifications;

# 2. Seed notification types
php artisan db:seed --class=NotificationTypeSeeder

# 3. Clear cache
php artisan config:clear
php artisan cache:clear
```

### Check logs:
```bash
# View latest errors
tail -f storage/logs/laravel.log
```

---

## 📊 User Preferences

Users can enable/disable notifications at:
**Settings → Notifications**

Admins can configure defaults at:
**Admin → Notification Preferences**

---

## 🚀 Production Checklist

- [x] Set `BROADCAST_CONNECTION=null` in .env
- [x] Run `npm run build`
- [x] Run `php artisan migrate`
- [x] Seed notification types
- [x] Test with command: `php artisan notifications:test`
- [x] Deploy and enjoy! 🎉

---

## 💡 FAQ

**Q: Do I need WebSockets?**  
A: NO! Your system uses database polling. Works everywhere.

**Q: Is 30 seconds too slow?**  
A: For fleet management, 30s is perfect. You can make it faster (20s) if needed.

**Q: What if I upgrade hosting later?**  
A: You can add WebSockets then. But honestly, polling works great.

**Q: Does this affect performance?**  
A: No! Polling is efficient and only hits one lightweight API endpoint.

---

That's it! Your notifications are **production-ready** right now. 🚀

Questions? Check `storage/logs/laravel.log` or run the test command.

