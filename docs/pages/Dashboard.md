# Dashboard Page Documentation

## Overview

The Dashboard (`resources/js/pages/Dashboard.tsx`) is the main landing page after login, providing a comprehensive overview of fleet operations, financial performance, and safety metrics.

## Key Features

### Executive Summary
- **Total Fleet Size**: Active trucks count
- **Active Drivers**: Currently assigned drivers
- **Total Operations**: Active operations count
- **Network Coverage**: Geographic reach metrics
- **Financial Recovery**: Revenue and cost metrics
- **Safety Performance**: Incident rates and compliance

### Network Overview
- **Fleet Utilization**: Active vs inactive trucks
- **Driver Assignment**: Assigned vs unassigned drivers
- **Geographic Distribution**: Coverage by region/zone
- **Operation Status**: Active, completed, pending operations

### Financial Overview
- **Total Revenue**: Cumulative revenue from operations
- **Total Costs**: Operating expenses breakdown
- **Gross Margin**: Profitability metrics
- **Cost per Ton-Km**: Efficiency indicators

### Asset Overview
- **Truck Status**: Active, maintenance, inactive breakdown
- **Maintenance Alerts**: Overdue and upcoming maintenance
- **Fuel Efficiency**: Average fuel consumption metrics
- **Vehicle Age Distribution**: Fleet composition

### Safety Overview
- **Incident Rate**: Safety incidents per 1000 trips
- **Compliance Rate**: Safety compliance percentage
- **Driver Safety Records**: Recent incidents
- **Trend Analysis**: Safety metrics over time

### Recent Activity
- **Top Customers**: Highest revenue customers
- **Recent Performances**: Latest trip records
- **Active Operations**: Current operations status

## Data Sources

- **Executive Summary**: Aggregated from multiple models (Trucks, Drivers, Operations, Performances)
- **Financial Data**: From Financial records and Performance costs
- **Safety Data**: From DriverSafety records
- **Maintenance Data**: From Maintenance records

## Permissions

- `dashboard.view` - Required to access the dashboard

## Components Used

- `AppLayout` - Main application layout
- `Card` - Metric display cards
- `AreaChart`, `BarChart`, `PieChart` - Data visualization
- `Table` - Recent activity tables
- `Badge` - Status indicators

## Mobile Responsiveness

- Executive summary metrics are hidden on mobile (`hidden md:grid`)
- Charts are responsive and adapt to screen size
- Tables scroll horizontally on mobile devices

## Related Documentation

- [Backend Dashboard Controller](../backend/README.md#dashboard)
- [Frontend Components](../frontend/README.md#components)

