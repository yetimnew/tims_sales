# Trucks Pages Documentation

## Overview

Trucks pages manage the fleet vehicle inventory, including truck registration, specifications, status tracking, and performance analytics.

## Pages

### Index Page (`Trucks/Index.tsx`)
**Purpose**: List and manage all trucks in the fleet

**Key Features**:
- Searchable truck list
- Status filtering (active, inactive, maintenance)
- Vehicle type filtering
- Sortable columns
- Pagination
- Mobile-responsive list view

**Key Metrics Displayed**:
- Plate number
- Vehicle type
- Capacity
- Status badge
- Current driver assignment
- Total operations count
- Created date

**Statistics Cards** (hidden on mobile):
- Total trucks
- Active trucks
- Inactive trucks
- Trucks in maintenance

**Permissions**: `trucks.view`

### Show Page (`Trucks/Show.tsx`)
**Purpose**: Detailed truck information and performance analytics

**Key Features**:
- **Truck Details**: Plate, type, capacity, status, registration info
- **Current Assignment**: Active driver-truck assignment
- **Performance Metrics**:
  - Total trips
  - Total distance
  - Total ton-km
  - Average load factor
  - Fuel efficiency
  - Cost per ton-km
- **Maintenance History**: Recent maintenance records
- **Performance Timeline**: Trip history and trends
- **Assignment History**: Driver assignment timeline
- **Activity Logs**: Complete audit trail

**Tabbed Interface**:
- Overview
- Performance
- Maintenance
- Assignments

**Permissions**: `trucks.show`

### Create Page (`Trucks/Create.tsx`)
**Purpose**: Register new trucks

**Key Features**:
- Plate number input (unique)
- Vehicle type selection
- Capacity input
- Status selection
- Registration details
- Purchase information

**Validation**:
- Plate number required and unique
- Vehicle type required
- Capacity must be positive
- All dates valid

**Permissions**: `trucks.create`

### Edit Page (`Trucks/Edit.tsx`)
**Purpose**: Update truck information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data
- Cannot change plate number (business rule)

**Permissions**: `trucks.edit`

### Assignment Performances Page (`Trucks/AssignmentPerformances.tsx`)
**Purpose**: View performance details for a specific driver-truck assignment

**Key Features**:
- Assignment timeline
- Summary snapshot (hidden on mobile)
- Performance metrics grid (hidden on mobile):
  - Loaded distance
  - Empty distance
  - Fuel used
  - Ton-KM
- Detailed trip list

**Permissions**: `trucks.show`

## Data Flow

1. **Index**: Fetches trucks with aggregated statistics
2. **Show**: Fetches truck with performance metrics and history
3. **Create/Edit**: Form submission validates and saves truck data
4. **Assignment Performances**: Fetches performance records for specific assignment

## Related Models

- `Truck` - Main truck model
- `VehicleType` - Vehicle type classification
- `DriverTruck` - Driver assignments
- `Performance` - Trip records
- `VehicleMaintenanceRecord` - Maintenance history

## Related Documentation

- [Fleet Management](../features/fleet-management.md)
- [Truck Management](../features/trucks-readme.md)
- [Backend Truck Controller](../backend/README.md#trucks)

