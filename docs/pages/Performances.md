# Performances Pages Documentation

## Overview

Performances pages track internal fleet trip execution, capturing driver-truck assignments, routes, cargo, distances, costs, and trip status.

## Pages

### Index Page (`Performances/Index.tsx`)
**Purpose**: List and filter all performance records (trips)

**Key Features**:
- Searchable trip list by FO number
- Status filtering (active, completed, cancelled)
- Load phase filtering (main, return)
- Sortable columns
- Pagination
- CSV export functionality

**Key Metrics Displayed**:
- FO Number
- Dispatch date
- Load phase
- Load completion
- Status
- Distance (KM)
- Fuel cost

**Permissions**: `performances.view`, `performances.export`

### Show Page (`Performances/Show.tsx`)
**Purpose**: Detailed trip analysis with economics and operation context

**Key Features**:
- **Trip Details**: FO number, dates, driver-truck assignment, route
- **Trip Economics**:
  - Ton-km calculation
  - Cost per ton-km
  - Revenue (based on operation tariff)
  - Gross margin (value and percentage)
  - Yield per ton and per km
- **Operational KPIs**:
  - Load factor
  - Empty backhaul share
  - Distance mix (loaded vs empty)
  - Load utilization vs truck capacity
- **Operation Context**:
  - Linked operation details
  - Contribution to operation (tonnage share, planned contribution)
  - Operation trends and economics
- **Cost Breakdown**:
  - Fuel cost
  - Perdiem
  - Other costs
  - Total cost
- **Activity Logs**: Complete audit trail

**Mathematical Calculations**:
- `Total Distance = DistanceWCargo + DistanceWOCargo`
- `Ton-Km = DistanceWCargo × CargoVolumMT`
- `Cost per Ton-Km = totalCost / tonKm`
- `Revenue = tonKm × operationTariff`
- `Gross Margin = revenue - totalCost`
- `Load Factor = (DistanceWCargo / totalDistance) × 100`
- `Load Utilization = (CargoVolumMT / truckCapacity) × 100`

**Permissions**: `performances.show`

### Create Page (`Performances/Create.tsx`)
**Purpose**: Record new trip performance

**Key Features**:
- Operation selection
- Driver-truck assignment selection
- Origin and destination selection
- Dispatch date and return date
- Load phase and completion status
- Distance (with/without cargo)
- Cargo volume
- Cost inputs (fuel, perdiem, other)
- Status selection

**Validation**:
- Operation required
- Driver-truck assignment required
- Origin ≠ destination
- Dispatch date not in future
- Return date ≥ dispatch date
- All numeric values non-negative

**Permissions**: `performances.create`

### Edit Page (`Performances/Edit.tsx`)
**Purpose**: Update existing trip records

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data
- Validation same as Create

**Permissions**: `performances.edit`

## Data Flow

1. **Index**: Fetches performances with filters and pagination
2. **Show**: Fetches performance with operation insights and calculated metrics
3. **Create/Edit**: Form submission validates and saves performance data

## Related Models

- `Performance` - Main performance model
- `Operation` - Linked operation
- `DriverTruck` - Driver-truck assignment
- `Place` - Origin and destination
- `Truck` - Vehicle information
- `Driver` - Driver information

## Related Documentation

- [Operations & Performance Guide](../features/README.md)
- [Backend Performance Controller](../backend/README.md#performances)

