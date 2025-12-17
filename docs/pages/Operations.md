# Operations Pages Documentation

## Overview

Operations pages manage transport operations (contracts/work orders) including creation, tracking, and analysis of operational performance.

## Pages

### Index Page (`Operations/Index.tsx`)
**Purpose**: List and filter all operations with completion tracking

**Key Features**:
- Searchable operation list
- Status filtering (active, inactive, closed)
- Completion rate indicators
- Delivered vs planned tonnage visualization
- Customer filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Operation ID
- Customer name
- Planned volume (tonnes)
- Delivered volume (tonnes)
- Completion percentage
- Status badge
- Created date

**Permissions**: `operations.view`

### Show Page (`Operations/Show.tsx`)
**Purpose**: Detailed operation analysis with performance insights

**Key Features**:
- **Operation Details**: Customer, destination, dates, volume, km, tariff
- **Performance Totals**: 
  - Total trips, completed trips, ongoing trips
  - Total tonnage vs planned volume
  - Completion rate
  - Return rate
  - Average ton per trip
- **Financial Metrics**:
  - Total cost
  - Average cost per trip
  - Average cost per ton
  - Cost per ton-km
- **Economics Analysis**:
  - Revenue Potential = volume × km × tariff
  - Actual Revenue = actual ton-km × tariff
  - Revenue Gap = Potential - Actual
  - Gross Margin (value and percentage)
  - Yield per trip and per ton
- **Transport Execution**:
  - Company vs vendor trip breakdown
  - Cost comparison
  - Execution mode (company/vendor/hybrid)
- **Trends**:
  - Timeline chart (trips and tonnage over time)
  - Tonnage breakdown pie chart
- **Activity Logs**: Complete audit trail

**Mathematical Calculations**:
- `Revenue Potential = volume × km × tariff`
- `Actual Revenue = totalTonKm × tariff`
- `Revenue Gap = potentialRevenue - actualRevenue`
- `Gross Margin = actualRevenue - totalCost`
- `Gross Margin % = (grossMargin / actualRevenue) × 100`
- `Completion Rate = (totalTonnage / plannedVolume) × 100`
- `Return Rate = (completedTrips / totalTrips) × 100`
- `Load Factor = (loadedDistance / totalDistance) × 100`
- `Empty Backhaul Share = (emptyDistance / totalDistance) × 100`

**Permissions**: `operations.show`

### Create Page (`Operations/Create.tsx`)
**Purpose**: Create new transport operations

**Key Features**:
- Customer selection
- Cargo type and service type selection
- Destination scope selection (Region/Zone/Woreda/Place)
- Volume, km, and tariff input
- Start and end date selection
- Status selection

**Validation**:
- Customer required
- Cargo type required
- Destination must exist for selected scope
- Volume, km, tariff must be non-negative
- Dates must be valid

**Permissions**: `operations.create`

### Edit Page (`Operations/Edit.tsx`)
**Purpose**: Update existing operations

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data
- Cannot edit if operation has performances (business rule)

**Permissions**: `operations.edit`

## Data Flow

1. **Index**: Fetches operations with aggregated performance data
2. **Show**: Fetches operation with detailed performance insights and financial calculations
3. **Create/Edit**: Form submission validates and saves operation data

## Related Models

- `Operation` - Main operation model
- `Performance` - Internal fleet trips
- `OutsourcePerformance` - Vendor trips
- `Customer` - Customer information

## Related Documentation

- [Operations & Performance Guide](../features/README.md)
- [Backend Operation Controller](../backend/README.md#operations)

