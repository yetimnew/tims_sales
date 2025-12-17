# Vehicle Types Pages Documentation

## Overview

Vehicle Types pages manage vehicle type classifications and specifications.

## Pages

### Index Page (`VehicleTypes/Index.tsx`)
**Purpose**: List and manage all vehicle types

**Key Features**:
- Searchable vehicle type list
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Vehicle type name
- Category
- Default capacity
- Truck count (using this type)
- Created date

**Permissions**: `vehicle-types.view`

### Show Page (`VehicleTypes/Show.tsx`)
**Purpose**: Detailed vehicle type information

**Key Features**:
- **Type Details**: Name, category, specifications
- **Trucks Using Type**: List of trucks with this type
- **Specifications**: Capacity, dimensions, etc.
- **Activity Logs**: Complete audit trail

**Permissions**: `vehicle-types.show`

### Create Page (`VehicleTypes/Create.tsx`)
**Purpose**: Create new vehicle types

**Key Features**:
- Type name
- Category selection
- Default capacity
- Specifications

**Validation**:
- Name required
- Name unique
- Capacity positive

**Permissions**: `vehicle-types.create`

### Edit Page (`VehicleTypes/Edit.tsx`)
**Purpose**: Update vehicle type information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `vehicle-types.edit`

## Related Models

- `VehicleType` - Main vehicle type model
- `Truck` - Trucks using this type

## Related Documentation

- [Fleet Management](../features/fleet-management.md)

