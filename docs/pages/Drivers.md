# Drivers Pages Documentation

## Overview

Drivers pages manage driver profiles, assignments, performance tracking, and safety records.

## Pages

### Index Page (`Drivers/Index.tsx`)
**Purpose**: List and manage all drivers

**Key Features**:
- Searchable driver list
- Status filtering (active, inactive)
- Gender filtering
- Sortable columns
- Pagination
- Mobile-responsive list view

**Key Metrics Displayed**:
- Driver name
- License number
- Gender badge
- Status badge
- Current truck assignment
- Total operations count
- Created date

**Statistics Cards** (hidden on mobile):
- Total drivers
- Active drivers
- Inactive drivers
- Male/Female breakdown

**Permissions**: `drivers.view`

### Show Page (`Drivers/Show.tsx`)
**Purpose**: Detailed driver profile and performance analytics

**Key Features**:
- **Driver Details**: Name, license, contact, status
- **Current Assignment**: Active driver-truck assignment
- **Performance Metrics**:
  - Total trips
  - Total distance
  - Total ton-km
  - Average load factor
  - Safety score
  - Performance grade
- **Safety Records**: Recent safety incidents
- **Performance History**: Trip history and trends
- **Assignment History**: Truck assignment timeline
- **Activity Logs**: Complete audit trail

**Tabbed Interface**:
- Overview
- Performance
- Safety
- Assignments

**Permissions**: `drivers.show`

### Create Page (`Drivers/Create.tsx`)
**Purpose**: Register new drivers

**Key Features**:
- Personal information (name, license, contact)
- Gender selection
- Status selection
- License details
- Employment information

**Validation**:
- Name required
- License number required and unique
- Contact information validation
- All dates valid

**Permissions**: `drivers.create`

### Edit Page (`Drivers/Edit.tsx`)
**Purpose**: Update driver information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `drivers.edit`

### Assignment Performances Page (`Drivers/AssignmentPerformances.tsx`)
**Purpose**: View performance details for a specific driver-truck assignment

**Key Features**:
- Assignment timeline
- Summary snapshot (hidden on mobile)
- Performance metrics grid (hidden on mobile)
- Detailed trip list

**Permissions**: `drivers.show`

## Data Flow

1. **Index**: Fetches drivers with aggregated statistics
2. **Show**: Fetches driver with performance metrics and history
3. **Create/Edit**: Form submission validates and saves driver data
4. **Assignment Performances**: Fetches performance records for specific assignment

## Related Models

- `Driver` - Main driver model
- `DriverTruck` - Truck assignments
- `Performance` - Trip records
- `DriverSafetyRecord` - Safety incidents
- `DriverPerformanceRecord` - Performance metrics

## Related Documentation

- [Driver Grading System](../features/driver-grading.md)
- [Fleet Management](../features/fleet-management.md)
- [Backend Driver Controller](../backend/README.md#drivers)

