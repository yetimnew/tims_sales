# Roles Pages Documentation

## Overview

Roles pages manage user roles and their associated permissions.

## Pages

### Index Page (`Roles/Index.tsx`)
**Purpose**: List and manage all roles

**Key Features**:
- Searchable role list
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Role name
- Permission count
- User count
- Created date

**Permissions**: `roles.view`

### Show Page (`Roles/Show.tsx`)
**Purpose**: Detailed role information and permissions

**Key Features**:
- **Role Details**: Name, description
- **Assigned Permissions**: List of all permissions
- **Users with Role**: List of users assigned this role
- **Activity Logs**: Complete audit trail

**Permissions**: `roles.show`

### Create Page (`Roles/Create.tsx`)
**Purpose**: Create new roles

**Key Features**:
- Role name
- Description (optional)
- Permission assignment (multiple select)

**Validation**:
- Name required
- Name unique

**Permissions**: `roles.create`

### Edit Page (`Roles/Edit.tsx`)
**Purpose**: Update role information and permissions

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data
- Permission management

**Permissions**: `roles.edit`

## Related Models

- `Role` - Main role model
- `Permission` - Role permissions
- `User` - Users with role

## Related Documentation

- [Permission System](../technical/README.md#permissions)
- [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission)

