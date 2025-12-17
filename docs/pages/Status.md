# Status Pages Documentation

## Overview

Status pages track daily truck status and status history.

## Pages

### Index Page (`Status/Index.tsx`)
**Purpose**: List and manage status records

**Key Features**:
- Searchable status list
- Truck filtering
- Date filtering
- Status type filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Truck (plate number)
- Status type
- Date
- Location
- Notes
- Created date

**Permissions**: `status.view`

### Board Page (`Status/Board.tsx`)
**Purpose**: Kanban-style status board

**Key Features**:
- Visual status board
- Drag-and-drop status updates
- Status columns
- Truck cards

**Permissions**: `status.view`

### Status Daily (`Status/StatusDaily.tsx`)
**Purpose**: Daily status overview

**Key Features**:
- Daily status summary
- Status distribution
- Truck status breakdown
- Daily trends

**Permissions**: `status.view`

### Status History (`Status/StatusHistory.tsx`)
**Purpose**: Historical status tracking

**Key Features**:
- Status timeline
- Status changes over time
- Truck status history
- Status trends

**Permissions**: `status.view`

### Show Page (`Statuses/Show.tsx`)
**Purpose**: Detailed status record information

**Key Features**:
- **Status Details**: Type, truck, date, location
- **Truck Information**: Truck details
- **Status History**: Previous statuses
- **Activity Logs**: Complete audit trail

**Permissions**: `status.show`

### Create Page (`Statuses/Create.tsx`)
**Purpose**: Record new status

**Key Features**:
- Truck selection
- Status type selection
- Date selection
- Location input
- Notes

**Validation**:
- Truck required
- Status type required
- Date required

**Permissions**: `status.create`

### Edit Page (`Statuses/Edit.tsx`)
**Purpose**: Update status records

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `status.edit`

### Daily Page (`Statuses/Daily.tsx`)
**Purpose**: Daily status entry and overview

**Key Features**:
- Quick status entry
- Daily status summary
- Status distribution charts

**Permissions**: `status.view`

## Related Models

- `Status` - Main status model
- `StatusType` - Status type classification
- `Truck` - Truck information

## Related Documentation

- [Status Types Pages](./StatusTypes.md)

