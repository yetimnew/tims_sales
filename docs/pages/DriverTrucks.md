# Driver-Truck Assignments Pages Documentation

## Overview

Driver-Truck Assignment pages manage the assignment of drivers to trucks, tracking assignment history and performance.

## Pages

### Index Page (`DriverTrucks/Index.tsx`)
**Purpose**: List and manage all driver-truck assignments

**Key Features**:
- Searchable assignment list
- Driver filtering
- Truck filtering
- Status filtering (active, inactive)
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Driver name
- Truck (plate number)
- Assignment start date
- Assignment end date
- Status
- Performance metrics

**Permissions**: `driver-trucks.view`

### Show Page (`DriverTrucks/Show.tsx`)
**Purpose**: Detailed assignment information

**Key Features**:
- **Assignment Details**: Driver, truck, dates, status
- **Performance Metrics**: Trips, distance, ton-km during assignment
- **Assignment Timeline**: Assignment history
- **Performance History**: Trip records during assignment
- **Activity Logs**: Complete audit trail

**Permissions**: `driver-trucks.show`

### Create Page (`DriverTrucks/Create.tsx`)
**Purpose**: Create new driver-truck assignment

**Key Features**:
- Driver selection
- Truck selection
- Start date
- End date (optional, for future assignments)
- Status selection

**Validation**:
- Driver required
- Truck required
- Driver and truck must be available
- Start date required
- End date ≥ start date (if provided)

**Permissions**: `driver-trucks.create`

### Edit Page (`DriverTrucks/Edit.tsx`)
**Purpose**: Update assignment information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data
- Can update end date to close assignment

**Permissions**: `driver-trucks.edit`

### Detach Page (`DriverTrucks/Detach.tsx`)
**Purpose**: Detach (end) driver-truck assignment

**Key Features**:
- Confirmation dialog
- End date selection
- Reason for detachment (optional)

**Permissions**: `driver-trucks.edit`

## Assignment Lifecycle

1. **Create**: Assign driver to truck with start date
2. **Active**: Assignment is active, driver can perform trips
3. **Detach**: End assignment with end date
4. **History**: Assignment remains in history for reporting

## Related Models

- `DriverTruck` - Main assignment model
- `Driver` - Driver information
- `Truck` - Truck information
- `Performance` - Trips during assignment

## Related Documentation

- [Drivers Pages](./Drivers.md)
- [Trucks Pages](./Trucks.md)
- [Driver-Truck Attach/Detach Report](./Reports.md#driver-truck-attach-detach)

