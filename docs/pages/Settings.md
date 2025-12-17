# Settings Pages Documentation

## Overview

Settings pages provide user account and system configuration management.

## Pages

### Profile (`settings/profile.tsx`)
**Purpose**: Manage user profile information

**Key Features**:
- Name update
- Email update
- Profile picture upload
- Contact information

**Permissions**: User's own profile

### Password (`settings/password.tsx`)
**Purpose**: Change user password

**Key Features**:
- Current password verification
- New password input
- Password confirmation
- Password strength indicator

**Permissions**: User's own password

### Two-Factor Authentication (`settings/two-factor.tsx`)
**Purpose**: Manage two-factor authentication

**Key Features**:
- Enable/disable 2FA
- Recovery codes management
- QR code for authenticator apps

**Permissions**: User's own 2FA

### Appearance (`settings/appearance.tsx`)
**Purpose**: Manage UI appearance preferences

**Key Features**:
- Theme selection (light/dark/system)
- UI preferences
- Display settings

**Permissions**: User's own appearance

### Notifications (`settings/notifications.tsx`)
**Purpose**: Manage notification preferences

**Key Features**:
- Email notification preferences
- In-app notification preferences
- Notification type toggles

**Permissions**: User's own notifications

### Driver Grading Settings (`settings/driver-grading.tsx`)
**Purpose**: Configure driver grading system

**Key Features**:
- Grade thresholds
- Performance weightings
- Safety weightings
- Grade definitions

**Permissions**: `settings.driver-grading`

### Truck Grading Settings (`settings/truck-grading.tsx`)
**Purpose**: Configure truck grading system

**Key Features**:
- Grade thresholds
- Performance weightings
- Utilization weightings
- Grade definitions

**Permissions**: `settings.truck-grading`

### Backups (`settings/backups.tsx`)
**Purpose**: Manage system backups

**Key Features**:
- Backup list
- Create backup
- Restore backup
- Download backup
- Delete backup

**Permissions**: `system.backup`

## Related Documentation

- [Encrypted Backups](../features/encrypted-backups/README.md)
- [Driver Grading](../features/driver-grading.md)
- [Truck Grading](../features/truck-grading.md)

