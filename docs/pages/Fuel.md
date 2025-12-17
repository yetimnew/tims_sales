# Fuel Pages Documentation

## Overview

Fuel pages provide fuel management and tracking capabilities (legacy/alternative to FuelRecords).

## Pages

### Index Page (`Fuel/Index.tsx`)
**Purpose**: List and manage fuel records

**Key Features**:
- Searchable fuel list
- Truck filtering
- Date filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Truck
- Date
- Fuel quantity
- Fuel cost
- Odometer

**Permissions**: `fuel.view`

### Create Page (`Fuel/Create.tsx`)
**Purpose**: Record fuel consumption

**Key Features**:
- Truck selection
- Date and fuel details
- Cost tracking

**Permissions**: `fuel.create`

### Edit Page (`Fuel/Edit.tsx`)
**Purpose**: Update fuel records

**Key Features**:
- Same fields as Create page
- Pre-populated data

**Permissions**: `fuel.edit`

## Note

This module may be a legacy implementation. See [Fuel Records](./FuelRecords.md) for the current implementation.

## Related Documentation

- [Fuel Records Pages](./FuelRecords.md)

