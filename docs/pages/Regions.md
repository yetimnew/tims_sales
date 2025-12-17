# Regions Pages Documentation

## Overview

Regions pages manage geographic regions, which are the top-level administrative divisions in the geographic hierarchy.

## Pages

### Index Page (`Regions/Index.tsx`)
**Purpose**: List and manage all regions

**Key Features**:
- Searchable region list
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Region name
- Code
- Zone count
- Place count
- Created date

**Permissions**: `regions.view`

### Show Page (`Regions/Show.tsx`)
**Purpose**: Detailed region information with hierarchy

**Key Features**:
- **Region Details**: Name, code, description
- **Zone Summary**: List of zones within region
- **Place Summary**: List of places within region
- **Geographic Hierarchy**: Visual representation
- **Activity Logs**: Complete audit trail

**Permissions**: `regions.show`

### Create Page (`Regions/Create.tsx`)
**Purpose**: Create new regions

**Key Features**:
- Region name
- Code (optional)
- Description (optional)

**Validation**:
- Name required
- Code unique (if provided)

**Permissions**: `regions.create`

### Edit Page (`Regions/Edit.tsx`)
**Purpose**: Update region information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `regions.edit`

## Geographic Hierarchy

```
Region
 ├─ Zone
 │   ├─ Woreda
 │   │   └─ Place
 │   └─ Place (direct)
 └─ Place (direct)
```

## Related Models

- `Region` - Main region model
- `Zone` - Zones within region
- `Woreda` - Woredas within zones
- `Place` - Places within regions/zones/woredas

## Related Documentation

- [Database Geographic Models](../database/README.md#geographic-models)

