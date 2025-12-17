# Outsource Performances Pages Documentation

## Overview

Outsource Performances pages track vendor trip execution, providing vendor performance analysis and benchmarking.

## Pages

### Index Page (`OutsourcePerformances/Index.tsx`)
**Purpose**: List and manage all vendor trip records

**Key Features**:
- Searchable trip list
- Vendor filtering
- Date range filtering
- Status filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Trip number
- Vendor name
- Dispatch date
- Route (from/to)
- Distance
- Cargo volume
- Ton-km
- Cost
- Status

**Statistics Cards** (hidden on mobile):
- Total vendor trips
- Total vendor tonnage
- Total vendor ton-km
- Total vendor cost

**Permissions**: `outsource-performances.view`

### Show Page (`OutsourcePerformances/Show.tsx`)
**Purpose**: Detailed vendor trip analysis with benchmarking

**Key Features**:
- **Trip Snapshot**: Distance, cargo, ton-km, cost
- **Vendor Benchmarks**: Historical vendor averages
- **Recent Trip Timeline**: Latest vendor trips
- **Performance Comparison**: Vendor vs company fleet
- **Route Information**: Origin and destination details
- **Activity Logs**: Complete audit trail

**Key Metrics**:
- Trip-level metrics (distance, cargo, ton-km, cost)
- Vendor averages (across all historical trips)
- Cost per ton-km comparison
- Performance trends

**Permissions**: `outsource-performances.show`

### Create Page (`OutsourcePerformances/Create.tsx`)
**Purpose**: Record new vendor trips

**Key Features**:
- Vendor selection
- Operation selection (optional)
- Trip number
- Dispatch date
- Origin and destination selection
- Distance input
- Cargo volume input
- Ton-km calculation/input
- Cost input
- Status selection
- Remarks

**Validation**:
- Vendor required
- Trip number required
- Dispatch date required
- Origin ≠ destination
- All numeric values non-negative

**Permissions**: `outsource-performances.create`

### Edit Page (`OutsourcePerformances/Edit.tsx`)
**Purpose**: Update vendor trip records

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `outsource-performances.edit`

## Data Flow

1. **Index**: Fetches vendor trips with aggregated statistics
2. **Show**: Fetches trip with vendor benchmarks and comparison metrics
3. **Create/Edit**: Form submission validates and saves trip data

## Related Models

- `OutsourcePerformance` - Main vendor trip model
- `Outsource` - Vendor information
- `Operation` - Linked operation (optional)
- `Place` - Origin and destination

## Related Documentation

- [Outsource Performance Show Guide](../features/outsource-performance-show.md)
- [Backend Outsource Performance Controller](../backend/README.md#outsource-performances)

