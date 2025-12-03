# Events & Notifications Overview

This document explains how domain events trigger user notifications, how notifications are stored and broadcast in real time, and what you need to run locally to verify the behaviour.

## Server-Side Flow

1. **Domain action** – When a controller mutates state (for example `TruckController@update`), it raises a domain event such as `App\Events\TruckUpdated`.
2. **Listener dispatch** – `AppServiceProvider` registers listeners like `SendTruckLifecycleNotification`. Each listener implements `ShouldQueue`, runs on the `notifications` queue, and calls `NotificationDispatcher` with the relevant `NotificationType` constant.
3. **Notification factory** – The listener builds a notification (for trucks that is `App\Notifications\TruckLifecycleNotification`) containing the title, message, metadata payload, and declares `toDatabase` / `toBroadcast` payloads.
4. **Recipient resolution** – `NotificationDispatcher` asks `NotificationPreferenceService` for recipients and channels. The service inspects explicit settings; if none exist, privileged roles default to `['database', 'broadcast']` when the broadcaster is Reverb.
5. **Queue execution** – Laravel pushes the job onto the `notifications` queue. Run `php artisan queue:work --queue=notifications,default --no-interaction` to process it. The job stores the notification in `notifications` / `notification_settings` tables and emits a broadcast event.

## Broadcasting & Real-Time Updates

- **Broadcaster** – `config/broadcasting.php` sets `BROADCAST_CONNECTION=reverb`. Reverb credentials (`REVERB_APP_KEY`, `REVERB_HOST`, etc.) live in `.env` and are mirrored to Vite (`VITE_REVERB_*`).
- **Server** – Start the websocket server with:
  ```bash
  php artisan reverb:start --no-interaction
  ```
- **Channels** – Notifications broadcast on the private channel `App.Models.User.{id}`.
- **Client bootstrap** – `resources/js/app.tsx` calls `configureEcho({ broadcaster: 'reverb', key, wsHost, wsPort, ... })` so the React app connects to Reverb using the Vite env values.
- **Subscription** – `resources/js/components/notification-bell.tsx` uses the Echo instance to subscribe to `App.Models.User.{id}`. When a broadcast arrives it triggers an Inertia `router.reload({ only: ['notifications'] })`, refreshing the header badge without reloading the whole page.

## Data Storage

- Notifications use Laravel's built-in database channel. Stored rows live in `notifications` (JSON payload) and `user_notification_settings` controls per-user channel preferences.
- Seeder classes:
  - `NotificationTypeSeeder` defines the canonical notification keys.
  - `AdminNotificationSettingsSeeder` (invoke via `php artisan db:seed --class=AdminNotificationSettingsSeeder`) enables email/in-app defaults for privileged users.

## Local Development Checklist

1. **Database** – Run migrations so the queue / notification tables exist:
   ```bash
   php artisan migrate --no-interaction
   ```
2. **Queues** – Start a worker dedicated to notification jobs:
   ```bash
   php artisan queue:work --queue=notifications,default --no-interaction
   ```
3. **Broadcast server** – Run Reverb alongside the worker:
   ```bash
   php artisan reverb:start --no-interaction
   ```
4. **Frontend build** – Restart Vite or rebuild whenever `.env` Vite variables change: `npm run dev` (or `npm run build`).
5. **Verification** – Open two browser sessions with different users. Trigger a domain change (e.g., create or update a truck). You should see:
   - The notification stored in the database.
   - The websocket connection (`ws://<host>:<port>`) stay open in DevTools.
   - The header bell badge update in the other browser without a full refresh.

## Troubleshooting

- **Worker exits immediately** – Check the worker console for SQL errors (missing `jobs` table) and run migrations. Ensure the queue name includes `notifications`.
- **No websocket connection** – Confirm Reverb is running, ports match `.env`, and firewall rules allow the port (defaults to 8081). In the browser DevTools → Network → WS, you should see an open connection.
- **No broadcast channel permission** – Verify the user passes the `Broadcast::channel('App.Models.User.{id}')` auth check (performed automatically when the user is authenticated).
- **No notification rows** – Ensure `NotificationPreferenceService` resolves channels. Users without roles/permissions might need explicit settings via the settings UI or database seeds.

With these pieces in place, notifications persist in the database for historical review while simultaneously streaming to connected clients through Reverb.
