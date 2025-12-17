# Permissions Page Documentation

## Overview

Permissions page manages system permissions and their assignment to roles.

## Page

### Index Page (`Permissions/Index.tsx`)
**Purpose**: List and view all system permissions

**Key Features**:
- Complete permission list
- Permission grouping by module
- Role assignment view
- Search functionality

**Key Information Displayed**:
- Permission name
- Module/group
- Assigned roles
- Description

**Permissions**: `permissions.view`

## Permission Structure

Permissions are organized by module:
- `trucks.*` - Truck management permissions
- `drivers.*` - Driver management permissions
- `operations.*` - Operation management permissions
- `performances.*` - Performance tracking permissions
- `reports.*` - Report viewing permissions
- `users.*` - User management permissions
- `roles.*` - Role management permissions
- `system.*` - System administration permissions

## Common Permission Actions

- `view` - View/list resources
- `show` - View single resource
- `create` - Create new resources
- `edit` - Edit existing resources
- `update` - Update resources
- `destroy` - Delete resources
- `export` - Export data

## Related Models

- `Permission` - Main permission model
- `Role` - Roles with permissions

## Related Documentation

- [Permission System](../technical/README.md#permissions)
- [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission)

