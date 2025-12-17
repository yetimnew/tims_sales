# Maintenance Types Pages Documentation

## Overview

Maintenance Types pages manage maintenance type classifications and schedules.

## Pages

### Index Page (`MaintenanceTypes/Index.tsx`)
**Purpose**: List and manage all maintenance types

**Key Features**:
- Searchable maintenance type list
- Category filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Maintenance type name
- Category
- Default interval
- Maintenance records count
- Created date

**Permissions**: `maintenance-types.view`

### Show Page (`MaintenanceTypes/Show.tsx`)
**Purpose**: Detailed maintenance type information

**Key Features**:
- **Type Details**: Name, category, interval, description
- **Maintenance Records**: List of maintenance using this type
- **Schedule Information**: Default intervals and schedules
- **Activity Logs**: Complete audit trail

**Permissions**: `maintenance-types.show`

### Create Page (`MaintenanceTypes/Create.tsx`)
**Purpose**: Create new maintenance types

**Key Features**:
- Maintenance type name
- Category selection
- Default interval (kilometers/days)
- Description

**Validation**:
- Name required
- Name unique
- Interval positive

**Permissions**: `maintenance-types.create`

### Edit Page (`MaintenanceTypes/Edit.tsx`)
**Purpose**: Update maintenance type information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `maintenance-types.edit`

## Related Models

- `MaintenanceType` - Main maintenance type model
- `VehicleMaintenanceRecord` - Maintenance records using this type

## Related Documentation

- [Maintenance Pages](./Maintenance.md)

