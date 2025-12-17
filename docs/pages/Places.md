# Places Pages Documentation

## Overview

Places pages manage specific locations/places, which are the lowest level in the geographic hierarchy and are used as origins/destinations for trips.

## Pages

### Index Page (`Places/Index.tsx`)
**Purpose**: List and manage all places

**Key Features**:
- Searchable place list
- Region filtering
- Zone filtering
- Woreda filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Place name
- Code
- Region name
- Zone name
- Woreda name
- Origin performances count
- Destination performances count
- Created date

**Permissions**: `places.view`

### Show Page (`Places/Show.tsx`)
**Purpose**: Detailed place information and usage statistics

**Key Features**:
- **Place Details**: Name, code, geographic hierarchy, coordinates
- **Geographic Hierarchy**: Region → Zone → Woreda → Place
- **Usage Statistics**: 
  - Origin performances count
  - Destination performances count
  - Total trips
- **Related Distances**: Distances to/from other places
- **Activity Logs**: Complete audit trail

**Permissions**: `places.show`

### Create Page (`Places/Create.tsx`)
**Purpose**: Create new places

**Key Features**:
- Place name
- Code (optional)
- Geographic assignment:
  - Option 1: Direct region assignment
  - Option 2: Zone assignment (within region)
  - Option 3: Woreda assignment (within zone)
- Coordinates (latitude/longitude) - optional
- Description (optional)

**Validation**:
- Name required
- Code unique (if provided)
- Geographic assignment required (region, zone, or woreda)

**Permissions**: `places.create`

### Edit Page (`Places/Edit.tsx`)
**Purpose**: Update place information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `places.edit`

## Geographic Hierarchy

Places can belong to:
- Region (direct)
- Zone (within region)
- Woreda (within zone, within region)

## Usage in System

Places are used as:
- **Origins** in Performance records
- **Destinations** in Performance records
- **From/To** in OutsourcePerformance records
- **Route endpoints** in distance calculations

## Related Models

- `Place` - Main place model
- `Region` - Parent region (optional)
- `Zone` - Parent zone (optional)
- `Woreda` - Parent woreda (optional)
- `Performance` - Trips using place as origin/destination
- `Distance` - Distances involving this place

## Related Documentation

- [Database Geographic Models](../database/README.md#geographic-models)
- [Operations & Performance Guide](../features/README.md)

