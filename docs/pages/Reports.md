# Reports Pages Documentation

## Overview

Reports pages provide comprehensive analytics and reporting capabilities for transport operations, performance analysis, and financial insights.

## Available Reports

### Performance Reports

#### Performance All (`Reports/PerformanceAll.tsx`)
**Purpose**: Comprehensive performance analysis across all operations

**Key Features**:
- Date range filtering
- Summary cards: Total Trips, Total Tonnage, Total Ton-KM, Total Revenue, Total Cost, Gross Margin
- Detailed table with trip-level metrics
- Export functionality

**Metrics**:
- Trips, tonnage, ton-km
- Distance (loaded/empty)
- Financial metrics (revenue, cost, profit, margin)
- Efficiency metrics (cost per ton-km, yield)

**Permissions**: `reports.performance-all.view`

#### Performance By Driver (`Reports/PerformanceByDriver.tsx`)
**Purpose**: Performance analysis grouped by driver

**Key Features**:
- Date range filtering
- Driver filtering (optional)
- Grouped metrics by driver
- Driver comparison capabilities

**Metrics**:
- Trips per driver
- Total tonnage per driver
- Total ton-km per driver
- Average performance metrics
- Cost efficiency per driver

**Permissions**: `reports.performance-by-driver.view`

#### Performance By Truck (`Reports/PerformanceByTruck.tsx`)
**Purpose**: Performance analysis grouped by truck

**Key Features**:
- Date range filtering
- Truck filtering (optional)
- Grouped metrics by truck
- Truck comparison capabilities

**Metrics**:
- Trips per truck
- Total tonnage per truck
- Total ton-km per truck
- Utilization rates
- Cost efficiency per truck

**Permissions**: `reports.performance-by-truck.view`

#### Performance By Status (`Reports/PerformanceByStatus.tsx`)
**Purpose**: Performance analysis grouped by trip status

**Key Features**:
- Date range filtering
- Status breakdown
- Status-based metrics

**Metrics**:
- Trips by status
- Tonnage by status
- Revenue by status
- Completion rates

**Permissions**: `reports.performance-by-status.view`

### Financial Reports

#### Operation Profitability (`Reports/OperationProfitability.tsx`)
**Purpose**: Profitability analysis by operation

**Key Features**:
- Date range filtering
- Customer filtering
- Operation-level profitability metrics

**Metrics**:
- Revenue per operation
- Cost per operation
- Profit per operation
- Margin percentage
- Completion rates

**Permissions**: `reports.operation-profitability.view`

#### Customer Profitability (`Reports/CustomerProfitability.tsx`)
**Purpose**: Profitability analysis by customer

**Key Features**:
- Date range filtering
- Customer filtering
- Customer-level aggregation

**Metrics**:
- Total revenue per customer
- Total cost per customer
- Profit per customer
- Margin percentage
- Operation count

**Permissions**: `reports.customer-profitability.view`

#### Route Profitability (`Reports/RouteProfitability.tsx`)
**Purpose**: Profitability analysis by route (origin-destination pairs)

**Key Features**:
- Date range filtering
- Origin/destination filtering
- Route-level aggregation

**Metrics**:
- Trips per route
- Tonnage per route
- Ton-km per route
- Revenue per route
- Cost per route
- Profit and margin per route
- Per-kilometer metrics

**Permissions**: `reports.route-profitability.view`

### Efficiency Reports

#### Fuel Efficiency (`Reports/FuelEfficiency.tsx`)
**Purpose**: Fuel consumption and efficiency analysis

**Key Features**:
- Date range filtering
- Truck/driver filtering
- Fuel efficiency metrics

**Metrics**:
- Fuel consumption
- Fuel cost
- Distance per liter
- Cost per kilometer
- Efficiency trends

**Permissions**: `reports.fuel-efficiency.view`

#### Load Factor & Utilization (`Reports/LoadFactorUtilization.tsx`)
**Purpose**: Load factor and utilization analysis

**Key Features**:
- Date range filtering
- Group by: Overall, Truck, Driver, Route
- Utilization metrics

**Metrics**:
- Load factor percentage
- Empty miles percentage
- Deadhead ratio
- Utilization rate
- Distance breakdown (loaded/empty)

**Permissions**: `reports.load-factor-utilization.view`

#### Cost Per Kilometer (`Reports/CostPerKilometer.tsx`)
**Purpose**: Cost per kilometer (CPK) analysis

**Key Features**:
- Date range filtering
- Group by: Overall, Truck, Driver, Route
- Cost breakdown

**Metrics**:
- Total CPK
- Fuel CPK
- Perdiem CPK
- Work ongoing CPK
- Other costs CPK
- Cost percentage breakdown

**Permissions**: `reports.cost-per-kilometer.view`

### Grading Reports

#### Driver Grading (`Reports/DriverGrading.tsx`)
**Purpose**: Driver performance grading and ranking

**Key Features**:
- Date range filtering
- Grade filtering
- Driver ranking

**Metrics**:
- Performance grade
- Safety score
- Efficiency metrics
- Ranking position

**Permissions**: `reports.driver-grading.view`

#### Truck Grading (`Reports/TruckGrading.tsx`)
**Purpose**: Truck performance grading and ranking

**Key Features**:
- Date range filtering
- Grade filtering
- Truck ranking

**Metrics**:
- Performance grade
- Utilization score
- Efficiency metrics
- Ranking position

**Permissions**: `reports.truck-grading.view`

### Other Reports

#### Outsource Performance (`Reports/OutsourcePerformance.tsx`)
**Purpose**: Vendor performance analysis

**Key Features**:
- Date range filtering
- Vendor filtering
- Vendor comparison

**Metrics**:
- Vendor trips
- Vendor tonnage
- Vendor costs
- Cost per ton-km comparison

**Permissions**: `reports.outsource-performance.view`

#### Maintenance (`Reports/Maintenance.tsx`)
**Purpose**: Maintenance performance analysis

**Key Features**:
- Date range filtering
- Maintenance type filtering
- Maintenance metrics

**Metrics**:
- Maintenance frequency
- Maintenance costs
- Downtime analysis
- Cost trends

**Permissions**: `reports.maintenance.view`

#### Geography Heatmaps (`Reports/GeographyHeatmaps.tsx`)
**Purpose**: Geographic performance visualization

**Key Features**:
- Date range filtering
- Geographic filtering
- Heatmap visualization

**Metrics**:
- Performance by region/zone/woreda
- Route density
- Activity hotspots

**Permissions**: `reports.geography-heatmaps.view`

#### Driver-Truck Attach/Detach (`Reports/DriverTruckAttachDetach.tsx`)
**Purpose**: Assignment history and analysis

**Key Features**:
- Date range filtering
- Assignment timeline
- Assignment metrics

**Metrics**:
- Assignment duration
- Assignment frequency
- Performance during assignments

**Permissions**: `reports.driver-truck-attach-detach.view`

## Common Features

All reports share:
- **Date Range Filters**: From/To date selection
- **Summary Cards**: Key metrics at a glance
- **Detailed Tables**: Comprehensive data breakdown
- **Export Functionality**: CSV/Excel export (where available)
- **Reset Filters**: Clear all filters
- **Generate Report**: Apply filters and generate results
- **Mobile Responsive**: Summary cards hidden on mobile, tables scroll

## Report Structure

1. **Header**: Report title and description
2. **Filters**: Date range and optional filters (truck, driver, customer, etc.)
3. **Summary Grid**: Key metrics cards (hidden on mobile)
4. **Detailed Table**: Comprehensive data with sorting and pagination

## Related Documentation

- [Backend Report Services](../backend/README.md#reports)
- [Report Components](../frontend/README.md#report-components)

