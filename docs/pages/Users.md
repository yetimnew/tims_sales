# Users Pages Documentation

## Overview

Users pages manage system users, their roles, permissions, and account settings.

## Pages

### Index Page (`Users/Index.tsx`)
**Purpose**: List and manage all system users

**Key Features**:
- Searchable user list
- Role filtering
- Status filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- User name
- Email
- Role(s)
- Status
- Last login
- Created date

**Statistics Cards** (hidden on mobile):
- Total users
- Active users
- Inactive users
- Admin users

**Permissions**: `users.view`

### Show Page (`Users/Show.tsx`)
**Purpose**: Detailed user profile and activity

**Key Features**:
- **User Details**: Name, email, roles, status
- **Account Information**: Created date, last login
- **Roles & Permissions**: Assigned roles and permissions
- **Activity Logs**: User activity history
- **Recent Actions**: Recent user actions

**Permissions**: `users.show`

### Create Page (`Users/Create.tsx`)
**Purpose**: Create new user accounts

**Key Features**:
- Name input
- Email input
- Password input
- Role assignment
- Status selection

**Validation**:
- Name required
- Email required, unique, valid format
- Password required, minimum strength
- Role required

**Permissions**: `users.create`

### Edit Page (`Users/Edit.tsx`)
**Purpose**: Update user information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data
- Password update (optional)
- Role management

**Permissions**: `users.edit`

## Related Models

- `User` - Main user model
- `Role` - User roles
- `Permission` - User permissions

## Related Documentation

- [Backend User Controller](../backend/README.md#users)
- [Permission System](../technical/README.md#permissions)

