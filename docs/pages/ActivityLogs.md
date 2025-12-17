# Activity Logs Pages Documentation

## Overview

Activity Logs pages provide audit trail functionality, tracking all changes made to system resources.

## Pages

### Index Page (`ActivityLogs/Index.tsx`)
**Purpose**: View all activity logs across the system

**Key Features**:
- Searchable activity log list
- Model filtering (which resource type)
- User filtering (who made the change)
- Event filtering (created, updated, deleted)
- Date range filtering
- Sortable columns
- Pagination

**Key Information Displayed**:
- Event type (created, updated, deleted)
- Model type (Truck, Driver, Operation, etc.)
- User (who made the change)
- Description
- Timestamp
- Changes (old/new values)

**Permissions**: `activity-logs.view`

### Show Page (`ActivityLogs/Show.tsx`)
**Purpose**: Detailed activity log entry

**Key Features**:
- **Activity Details**: Full event information
- **Changes**: Detailed before/after values
- **User Information**: Who made the change
- **Related Activities**: Related log entries
- **Model Information**: Link to the affected resource

**Permissions**: `activity-logs.show`

## Activity Tracking

The system tracks:
- **Created**: When resources are created
- **Updated**: When resources are updated (with change details)
- **Deleted**: When resources are deleted
- **Restored**: When soft-deleted resources are restored

## Models with Activity Logging

- Operations
- Performances
- Trucks
- Drivers
- Customers
- Users
- And more...

## Related Models

- `Activity` (Spatie Activity Log) - Main activity log model
- Various models with `LogsActivity` trait

## Related Documentation

- [Spatie Laravel Activitylog](https://spatie.be/docs/laravel-activitylog)
- [Backend Activity Logging](../backend/README.md#activity-logging)

