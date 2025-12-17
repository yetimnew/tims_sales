# Fuel Records Pages Documentation

## Overview

Fuel Records pages track fuel consumption and fuel-related costs.

## Pages

### Index Page (`FuelRecords/Index.tsx`)
**Purpose**: List and manage all fuel records

**Key Features**:
- Searchable fuel record list
- Truck filtering
- Date range filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Truck (plate number)
- Date
- Fuel quantity (liters)
- Fuel cost
- Odometer reading
- Created date

**Statistics Cards** (hidden on mobile):
- Total fuel consumed
- Total fuel cost
- Average fuel efficiency
- Recent fuel records

**Permissions**: `fuel-records.view`

### Show Page (`FuelRecords/Show.tsx`)
**Purpose**: Detailed fuel record information

**Key Features**:
- **Fuel Details**: Quantity, cost, date, odometer
- **Truck Information**: Truck details and fuel history
- **Cost Analysis**: Fuel cost trends
- **Efficiency Metrics**: Fuel efficiency calculations
- **Activity Logs**: Complete audit trail

**Permissions**: `fuel-records.show`

### Create Page (`FuelRecords/Create.tsx`)
**Purpose**: Record new fuel consumption

**Key Features**:
- Truck selection
- Date selection
- Fuel quantity (liters)
- Fuel cost
- Odometer reading
- Fuel station (optional)
- Notes

**Validation**:
- Truck required
- Date required
- Quantity required and positive
- Cost required and non-negative
- Odometer reading non-negative

**Permissions**: `fuel-records.create`

### Edit Page (`FuelRecords/Edit.tsx`)
**Purpose**: Update fuel records

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `fuel-records.edit`

## Related Models

- `FuelRecord` - Main fuel record model
- `Truck` - Truck information

## Related Documentation

- [Fuel Pages](./Fuel.md)
- [Backend Fuel Controller](../backend/README.md#fuel)

