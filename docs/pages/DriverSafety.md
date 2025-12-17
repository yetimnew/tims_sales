# Driver Safety Pages Documentation

## Overview

Driver Safety pages track driver safety incidents, violations, and safety records.

## Pages

### Index Page (`DriverSafety/Index.tsx`)
**Purpose**: List and manage all driver safety records

**Key Features**:
- Searchable safety record list
- Driver filtering
- Incident type filtering
- Date range filtering
- Severity filtering
- Sortable columns
- Pagination

**Key Metrics Displayed**:
- Driver name
- Incident type
- Date
- Severity
- Location
- Description
- Created date

**Statistics Cards** (hidden on mobile):
- Total incidents
- Critical incidents
- Minor incidents
- Safety score average

**Permissions**: `driver-safety.view`

### Show Page (`DriverSafety/Show.tsx`)
**Purpose**: Detailed safety incident information

**Key Features**:
- **Incident Details**: Type, date, location, description
- **Driver Information**: Driver profile and history
- **Severity Assessment**: Incident severity and impact
- **Corrective Actions**: Actions taken
- **Related Incidents**: Other incidents for same driver
- **Activity Logs**: Complete audit trail

**Permissions**: `driver-safety.show`

### Create Page (`DriverSafety/Create.tsx`)
**Purpose**: Record new safety incident

**Key Features**:
- Driver selection
- Incident type selection
- Date selection
- Location input
- Severity selection
- Description
- Corrective actions
- Related documents (optional)

**Validation**:
- Driver required
- Incident type required
- Date required
- Severity required

**Permissions**: `driver-safety.create`

### Edit Page (`DriverSafety/Edit.tsx`)
**Purpose**: Update safety records

**Key Features**:
- Same fields as Create page
- Pre-populated with existing data
- Can update corrective actions

**Permissions**: `driver-safety.edit`

## Related Models

- `DriverSafetyRecord` - Main safety record model
- `Driver` - Driver information

## Related Documentation

- [Driver Grading System](../features/driver-grading.md)
- [Drivers Pages](./Drivers.md)

