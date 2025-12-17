# Distances Pages Documentation

## Overview

Distances pages manage distance records between places, used for route planning and distance calculations.

## Pages

### Index Page (`Distances/Index.tsx`)
**Purpose**: List and manage all distance records

**Key Features**:
- Searchable distance list
- Origin filtering
- Destination filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Origin place
- Destination place
- Distance (kilometers)
- Route type
- Created date

**Permissions**: `distances.view`

### Show Page (`Distances/Show.tsx`)
**Purpose**: Detailed distance record information

**Key Features**:
- **Distance Details**: Origin, destination, distance, route type
- **Place Information**: Full geographic hierarchy for both places
- **Usage Statistics**: How often this route is used
- **Activity Logs**: Complete audit trail

**Permissions**: `distances.show`

### Create Page (`Distances/Create.tsx`)
**Purpose**: Create new distance records

**Key Features**:
- Origin place selection
- Destination place selection
- Distance input (kilometers)
- Route type selection (optional)

**Validation**:
- Origin required
- Destination required
- Origin ≠ destination
- Distance required and positive

**Permissions**: `distances.create`

### Edit Page (`Distances/Edit.tsx`)
**Purpose**: Update distance records

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `distances.edit`

## Usage in System

Distances are used for:
- Route planning
- Distance calculations in reports
- Performance analysis
- Cost calculations (distance-based)

## Related Models

- `Distance` - Main distance model
- `Place` - Origin and destination places

## Related Documentation

- [Database Geographic Models](../database/README.md#geographic-models)

