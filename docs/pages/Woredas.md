# Woredas Pages Documentation

## Overview

Woredas pages manage woredas, which are administrative divisions within zones.

## Pages

### Index Page (`Woredas/Index.tsx`)
**Purpose**: List and manage all woredas

**Key Features**:
- Searchable woreda list
- Zone filtering
- Region filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Woreda name
- Zone name
- Region name
- Code
- Place count
- Created date

**Permissions**: `woredas.view`

### Show Page (`Woredas/Show.tsx`)
**Purpose**: Detailed woreda information with hierarchy

**Key Features**:
- **Woreda Details**: Name, code, zone, region, description
- **Zone Summary**: Parent zone information
- **Region Summary**: Parent region information
- **Place Summary**: List of places within woreda
- **Geographic Hierarchy**: Visual representation
- **Activity Logs**: Complete audit trail

**Permissions**: `woredas.show`

### Create Page (`Woredas/Create.tsx`)
**Purpose**: Create new woredas

**Key Features**:
- Woreda name
- Zone selection (required)
- Code (optional)
- Description (optional)

**Validation**:
- Name required
- Zone required
- Code unique within zone (if provided)

**Permissions**: `woredas.create`

### Edit Page (`Woredas/Edit.tsx`)
**Purpose**: Update woreda information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `woredas.edit`

## Geographic Hierarchy

Woredas belong to Zones (which belong to Regions) and contain Places.

## Related Models

- `Woreda` - Main woreda model
- `Zone` - Parent zone
- `Region` - Parent region (via zone)
- `Place` - Places within woreda

## Related Documentation

- [Database Geographic Models](../database/README.md#geographic-models)

