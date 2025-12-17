# Maintenance Pages Documentation

## Overview

Maintenance pages manage vehicle maintenance records, scheduled maintenance, maintenance alerts, and maintenance history tracking.

## Pages

### Index Page (`Maintenance/Index.tsx`)
**Purpose**: List and manage all maintenance records

**Key Features**:
- Searchable maintenance list
- Status filtering
- Maintenance type filtering
- Truck filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Maintenance type
- Truck (plate number)
- Assigned mechanic
- Odometer reading
- Scheduled date
- Status
- Days until scheduled

**Permissions**: `maintenance.view`

### Show Page (`Maintenance/Show.tsx`)
**Purpose**: Detailed maintenance record information

**Key Features**:
- **Maintenance Details**: Type, truck, dates, odometer
- **Assigned Mechanic**: Mechanic information
- **Cost Breakdown**: Parts, labor, total cost
- **Status Tracking**: Current status and history
- **Related Records**: Other maintenance for same truck
- **Activity Logs**: Complete audit trail

**Permissions**: `maintenance.show`

### Create Page (`Maintenance/Create.tsx`)
**Purpose**: Record new maintenance

**Key Features**:
- Maintenance type selection
- Truck selection
- Scheduled date
- Odometer reading
- Assigned mechanic selection
- Description
- Status selection

**Validation**:
- Maintenance type required
- Truck required
- Scheduled date required
- Odometer reading non-negative

**Permissions**: `maintenance.create`

### Edit Page (`Maintenance/Edit.tsx`)
**Purpose**: Update maintenance records

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data
- Can update status and completion details

**Permissions**: `maintenance.edit`

### Overview Page (`Maintenance/Overview.tsx`)
**Purpose**: High-level maintenance overview and metrics

**Key Features**:
- Maintenance statistics
- Upcoming maintenance alerts
- Overdue maintenance
- Maintenance cost trends
- Truck maintenance history

**Permissions**: `maintenance.view`

### Alerts Page (`Maintenance/Alerts.tsx`)
**Purpose**: Maintenance alerts and notifications

**Key Features**:
- Overdue maintenance alerts
- Upcoming maintenance warnings
- Maintenance due soon
- Alert prioritization

**Permissions**: `maintenance.view`

## Data Flow

1. **Index**: Fetches maintenance records with filters
2. **Show**: Fetches maintenance record with related information
3. **Create/Edit**: Form submission validates and saves maintenance data
4. **Overview**: Aggregates maintenance statistics
5. **Alerts**: Fetches maintenance records requiring attention

## Related Models

- `VehicleMaintenanceRecord` - Main maintenance model
- `MaintenanceType` - Maintenance type classification
- `Truck` - Vehicle information
- `User` - Assigned mechanic

## Related Documentation

- [Backend Maintenance Controller](../backend/README.md#maintenance)

