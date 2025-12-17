# Status Types Pages Documentation

## Overview

Status Types pages manage status type classifications used throughout the system.

## Pages

### Index Page (`StatusTypes/Index.tsx`)
**Purpose**: List and manage all status types

**Key Features**:
- Searchable status type list
- Category filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Status type name
- Category
- Usage count
- Created date

**Permissions**: `status-types.view`

### Show Page (`StatusTypes/Show.tsx`)
**Purpose**: Detailed status type information

**Key Features**:
- **Type Details**: Name, category, description
- **Usage**: Where this status type is used
- **Activity Logs**: Complete audit trail

**Permissions**: `status-types.show`

### Create Page (`StatusTypes/Create.tsx`)
**Purpose**: Create new status types

**Key Features**:
- Status type name
- Category selection
- Description

**Validation**:
- Name required
- Name unique

**Permissions**: `status-types.create`

### Edit Page (`StatusTypes/Edit.tsx`)
**Purpose**: Update status type information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `status-types.edit`

## Related Models

- `StatusType` - Main status type model

## Related Documentation

- [Status Pages](./Status.md)

