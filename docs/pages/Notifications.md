# Notifications Pages Documentation

## Overview

Notifications pages manage user notifications and notification preferences.

## Pages

### Index Page (`Notifications/Index.tsx`)
**Purpose**: View and manage user notifications

**Key Features**:
- Notification list
- Unread/read filtering
- Notification types filtering
- Mark as read functionality
- Mark all as read
- Delete notifications
- Pagination

**Key Information Displayed**:
- Notification type
- Title
- Message
- Read status
- Timestamp
- Action buttons

**Permissions**: `notifications.view`

### Preferences Page (`Notifications/Preferences.tsx`)
**Purpose**: Manage notification preferences

**Key Features**:
- Email notification preferences
- In-app notification preferences
- Notification type toggles
- Frequency settings

**Permissions**: `notifications.preferences`

## Notification Types

- System notifications
- Operation updates
- Performance alerts
- Maintenance reminders
- Safety alerts
- Financial updates

## Related Models

- `Notification` - Main notification model
- `NotificationPreference` - User preferences

## Related Documentation

- [Events & Notifications](../features/events-and-notifications.md)
- [Notifications with Reverb](../development/notifications-reverb.md)

