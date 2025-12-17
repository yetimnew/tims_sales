# Zones Pages Documentation

## Overview

Zones pages manage geographic zones, which are subdivisions within regions.

## Pages

### Index Page (`Zones/Index.tsx`)
**Purpose**: List and manage all zones

**Key Features**:
- Searchable zone list
- Region filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Zone name
- Region name
- Code
- Woreda count
- Place count
- Created date

**Permissions**: `zones.view`

### Show Page (`Zones/Show.tsx`)
**Purpose**: Detailed zone information with hierarchy

**Key Features**:
- **Zone Details**: Name, code, region, description
- **Region Summary**: Parent region information
- **Woreda Summary**: List of woredas within zone
- **Place Summary**: List of places within zone
- **Geographic Hierarchy**: Visual representation
- **Activity Logs**: Complete audit trail

**Permissions**: `zones.show`

### Create Page (`Zones/Create.tsx`)
**Purpose**: Create new zones

**Key Features**:
- Zone name
- Region selection (required)
- Code (optional)
- Description (optional)

**Validation**:
- Name required
- Region required
- Code unique within region (if provided)

**Permissions**: `zones.create`

### Edit Page (`Zones/Edit.tsx`)
**Purpose**: Update zone information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `zones.edit`

## Geographic Hierarchy

Zones belong to Regions and contain Woredas and Places.

## Related Models

- `Zone` - Main zone model
- `Region` - Parent region
- `Woreda` - Woredas within zone
- `Place` - Places within zone

## Related Documentation

- [Database Geographic Models](../database/README.md#geographic-models)

