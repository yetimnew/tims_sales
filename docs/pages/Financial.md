# Financial Pages Documentation

## Overview

Financial pages track revenue and cost records, providing financial analysis and reporting capabilities.

## Pages

### Index Page (`Financial/Index.tsx`)
**Purpose**: List and manage all financial records

**Key Features**:
- Searchable financial records list
- Type filtering (revenue, cost)
- Date range filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Record type (revenue/cost)
- Amount
- Description
- Date
- Related entity (operation, customer, etc.)
- Created date

**Statistics Cards** (hidden on mobile):
- Total revenue
- Total costs
- Net profit
- Profit margin

**Permissions**: `financial.view`

### Show Page (`Financial/Show.tsx`)
**Purpose**: Detailed financial record information

**Key Features**:
- **Record Details**: Type, amount, description, date
- **Related Entity**: Linked operation, customer, or other entity
- **Category Breakdown**: Revenue/cost categories
- **Activity Logs**: Complete audit trail

**Permissions**: `financial.show`

### Create Page (`Financial/Create.tsx`)
**Purpose**: Record new financial transactions

**Key Features**:
- Record type selection (revenue/cost)
- Amount input
- Description
- Date selection
- Related entity selection (optional)
- Category selection

**Validation**:
- Type required
- Amount required and non-negative
- Date required and valid

**Permissions**: `financial.create`

### Edit Page (`Financial/Edit.tsx`)
**Purpose**: Update financial records

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `financial.edit`

## Data Flow

1. **Index**: Fetches financial records with aggregated statistics
2. **Show**: Fetches financial record with related information
3. **Create/Edit**: Form submission validates and saves financial data

## Related Models

- `FinancialRecord` - Main financial model
- `Operation` - Related operations
- `Customer` - Related customers

## Related Documentation

- [Backend Financial Controller](../backend/README.md#financial)

