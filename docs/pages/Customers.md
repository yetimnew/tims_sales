# Customers Pages Documentation

## Overview

Customers pages manage client relationships, tracking customer information, contact details, and associated operations.

## Pages

### Index Page (`Customers/Index.tsx`)
**Purpose**: List and manage all customers

**Key Features**:
- Searchable customer list
- Status filtering (active, inactive)
- Sortable columns
- Pagination
- Mobile-responsive list view

**Key Metrics Displayed**:
- Customer name
- Relationship owner (contact person)
- Phone number
- Email address
- Operations count
- Status badge
- Created date

**Statistics Cards** (hidden on mobile):
- Total customers
- Active customers
- Inactive customers
- Customers with operations

**Permissions**: `customers.view`

### Show Page (`Customers/Show.tsx`)
**Purpose**: Detailed customer profile and operations history

**Key Features**:
- **Customer Details**: Name, contact, address, status
- **Contact Information**: Phone, email, contact person
- **Operations History**: List of associated operations
- **Financial Summary**: Total revenue, total cost, profitability
- **Activity Logs**: Complete audit trail

**Permissions**: `customers.show`

### Create Page (`Customers/Create.tsx`)
**Purpose**: Register new customers

**Key Features**:
- Customer name
- Contact person
- Phone and email
- Address
- Status selection

**Validation**:
- Name required
- Contact information validation
- Email format validation

**Permissions**: `customers.create`

### Edit Page (`Customers/Edit.tsx`)
**Purpose**: Update customer information

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data

**Permissions**: `customers.edit`

## Data Flow

1. **Index**: Fetches customers with operation counts
2. **Show**: Fetches customer with associated operations and financial summary
3. **Create/Edit**: Form submission validates and saves customer data

## Related Models

- `Customer` - Main customer model
- `Operation` - Associated operations
- `Performance` - Performance records linked via operations

## Related Documentation

- [Backend Customer Controller](../backend/README.md#customers)

