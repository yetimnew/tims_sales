# Outsources Pages Documentation

## Overview

Outsources pages manage vendor/outsource partner information and relationships.

## Pages

### Index Page (`Outsources/Index.tsx`)
**Purpose**: List and manage all outsource vendors

**Key Features**:
- Searchable vendor list
- Status filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Vendor name
- Contact information
- Status
- Total trips
- Total cost
- Created date

**Permissions**: `outsources.view`

### Show Page (`Outsources/Show.tsx`)
**Purpose**: Detailed vendor profile and performance

**Key Features**:
- **Vendor Details**: Name, contact, address, status
- **Performance Metrics**: Total trips, tonnage, ton-km, costs
- **Performance History**: Trip history and trends
- **Benchmark Comparison**: Vendor vs company fleet averages
- **Activity Logs**: Complete audit trail

**Permissions**: `outsources.show`

### Create Page (`Outsources/Create.tsx`)
**Purpose**: Register new vendors

**Key Features**:
- Vendor name
- Contact information
- Address
- Status selection

**Validation**:
- Name required
- Contact information validation

**Permissions**: `outsources.create`

### Edit Page (`Outsources/Edit.tsx`)
**Purpose**: Update vendor information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `outsources.edit`

## Related Models

- `Outsource` - Main vendor model
- `OutsourcePerformance` - Vendor trip records

## Related Documentation

- [Outsource Performance Show](../features/outsource-performance-show.md)
- [Backend Outsource Controller](../backend/README.md#outsources)

