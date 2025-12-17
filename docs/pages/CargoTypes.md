# Cargo Types Pages Documentation

## Overview

Cargo Types pages manage cargo type classifications and handling requirements.

## Pages

### Index Page (`CargoTypes/Index.tsx`)
**Purpose**: List and manage all cargo types

**Key Features**:
- Searchable cargo type list
- Category filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Cargo type name
- Category
- Weight per cubic meter
- Requires special equipment
- Operations count
- Created date

**Permissions**: `cargo-types.view`

### Show Page (`CargoTypes/Show.tsx`)
**Purpose**: Detailed cargo type information

**Key Features**:
- **Type Details**: Name, category, specifications
- **Handling Requirements**: Special handling instructions
- **Safety Requirements**: Safety precautions
- **Operations Using Type**: List of operations with this cargo type
- **Activity Logs**: Complete audit trail

**Permissions**: `cargo-types.show`

### Create Page (`CargoTypes/Create.tsx`)
**Purpose**: Create new cargo types

**Key Features**:
- Cargo type name
- Category selection
- Weight per cubic meter
- Handling requirements
- Safety requirements
- Special equipment flag

**Validation**:
- Name required
- Name unique
- Category required

**Permissions**: `cargo-types.create`

### Edit Page (`CargoTypes/Edit.tsx`)
**Purpose**: Update cargo type information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `cargo-types.edit`

## Related Models

- `CargoType` - Main cargo type model
- `Operation` - Operations using this cargo type

## Related Documentation

- [Operations & Performance Guide](../features/README.md)

