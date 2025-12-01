## Notifications & Reverb Setup

This project ships with database-backed notifications and optional real-time broadcasts via Laravel Reverb. Follow these steps to ensure the notification bell and live updates work smoothly.

### 1. Seed Notification Types & Admin Defaults

```bash
php artisan db:seed --class=NotificationTypeSeeder --no-interaction
php artisan db:seed --class=AdminNotificationSettingsSeeder --no-interaction
```

The second seeder enables in-app notifications for the truck lifecycle types for all admin users (and users with the `trucks.view` permission).

### 2. Configure Queue Processing

Notifications are queued. During local development you can temporarily switch to sync:

```
QUEUE_CONNECTION=sync
```

Or run a worker:

```bash
php artisan queue:work --tries=3 --no-interaction
```

### 3. Configure Reverb (Optional Real-time Updates)

Update `.env`:

```
BROADCAST_DRIVER=reverb
REVERB_APP_ID=app-id
REVERB_APP_KEY=app-key
REVERB_APP_SECRET=app-secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http
```

Start the Reverb server:

```bash
php artisan reverb:start --host=127.0.0.1 --port=8080
```

On the frontend, ensure Echo is configured in `resources/js/app.tsx` to use Reverb.

### 4. Trigger Notifications

- Create, update, or delete a truck to fire `TruckCreated`, `TruckUpdated`, or `TruckDeleted` events.
- The listener `SendTruckLifecycleNotification` stores database notifications and, when broadcasting is enabled, pushes real-time updates.

### 5. Verify

Check the bell icon (sidebar header) for the unread count and dropdown entries. The notifications page (`/notifications`) provides the full list with mark-as-read actions.
