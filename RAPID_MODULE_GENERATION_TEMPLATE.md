# 🚀 Rapid Module Generation Template & Guide

## Overview
This document provides the exact pattern to quickly replicate for all remaining modules. We've already created:
- ✅ **CargoTypes** (4 pages: Index, Create, Edit, Show)
- ✅ **Customers** (Index page)
- ✅ **Regions** (Index, Create pages started)

## Remaining Modules to Implement (13 modules)

### **Tier 1: Simple Modules (6 modules - Name field only)**
1. Zone
2. Woreda
3. Place  
4. StatusType
5. Status
6. Operation

### **Tier 2: Medium Modules (5 modules - 2-4 fields)**
1. DriverPerformance
2. DriverSafety
3. RoutePlan
4. Customer (complete)
5. Outsource

### **Tier 3: Complex Modules (2 modules)**
1. OutsourcePerformance
2. Performance

---

## Quick Replication Pattern

### **For Simple Modules (Just name field)**

**Step 1: Index Page** - Use `Regions/Index.tsx` as template:
```bash
# Copy structure, replace:
- RegionsIndex → ModuleNameIndex
- regions → modulenames (lowercase plural)
- Region → ModuleName
- regions.create → modulenames.create
```

**Step 2: Create Page** - Use `Regions/Create.tsx`:
```bash
# Only field: name
# Change validateRegion → validateModulename
```

**Step 3: Edit Page** - Use Create as base:
```bash
# Add: pre-populated data
# Change post() → put()
# Change button text to "Update"
```

**Step 4: Show Page** - Use `CargoTypes/Show.tsx` as base:
```bash
# Remove unnecessary sections
# Keep: Basic Info, Activity Log, Quick Info sidebar
# Adjust fields for this module
```

---

## Module-Specific Field Mapping

### **Zone Module**
Fields: `name`, `region_id` (select)
Validation: `validateZone`

### **Woreda Module**
Fields: `name`, `zone_id` (select)
Validation: `validateWoreda`

### **Place Module**
Fields: `name`, `woreda_id` (select)
Validation: `validatePlace`

### **StatusType Module**
Fields: `name`
Validation: `validateStatusType`

### **Status Module**
Fields: `name`, `status_type_id` (select)
Validation: `validateStatus`

### **Operation Module**
Fields: `name`, `status` (select: active/inactive/completed)
Validation: `validateOperation`

### **DriverPerformance Module**
Fields: `driver_id`, `truck_id`, `record_date`, `total_trips`, `total_distance_km`, `period_type`
Validation: `validateDriverPerformance`

### **DriverSafety Module**
Fields: `driver_id`, `truck_id`, `record_date`, `safety_score` (0-100)
Validation: `validateDriverSafety`

### **RoutePlan Module**
Fields: `operation_id`, `truck_id`, `driver_id`, `planned_date`, `total_distance_km`, `total_travel_time_minutes`, `estimated_fuel_cost`
Validation: `validateRoutePlan`

### **Customer Module** (Complete this one)
Fields: `name`, `email`, `phone`, `address`, `contact_person`
Validation: `validateCustomer`

### **Outsource Module**
Fields: `name`, `contact_person`, `phone`, `email`, `address`, `service_type`
Validation: `validateOutsource`

---

## Backend Changes Required

### 1. Update Controllers
For each module, update the corresponding controller:

```php
// Use Spatie Activity Log
use Spatie\ActivityLog\Facades\Activity;

// In store() method:
Activity::performedOn($model)->causedBy(auth()->user())->log('created');

// In update() method:
Activity::performedOn($model)->causedBy(auth()->user())->withProperties(['old' => $oldData, 'new' => $model->toArray()])->log('updated');

// In destroy() method:
Activity::performedOn($model)->causedBy(auth()->user())->withProperties(['deleted' => $modelData])->log('deleted');

// In show() method:
$activityLogs = Activity::forSubject($model)->with('causer')->orderByDesc('created_at')->get();
```

### 2. Update Routes (routes/web.php)

```php
// For each module, add these routes with permissions:
Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('modulenames/export/csv', [ModuleController::class, 'export'])
        ->middleware('can:modulenames.export')
        ->name('modulenames.export');

    Route::get('modulenames', [ModuleController::class, 'index'])
        ->middleware('can:modulenames.view')
        ->name('modulenames.index');

    Route::get('modulenames/create', [ModuleController::class, 'create'])
        ->middleware('can:modulenames.create')
        ->name('modulenames.create');

    Route::post('modulenames', [ModuleController::class, 'store'])
        ->middleware('can:modulenames.store')
        ->name('modulenames.store');

    Route::get('modulenames/{modulename}', [ModuleController::class, 'show'])
        ->middleware('can:modulenames.show')
        ->name('modulenames.show');

    Route::get('modulenames/{modulename}/edit', [ModuleController::class, 'edit'])
        ->middleware('can:modulenames.edit')
        ->name('modulenames.edit');

    Route::put('modulenames/{modulename}', [ModuleController::class, 'update'])
        ->middleware('can:modulenames.update')
        ->name('modulenames.update');

    Route::delete('modulenames/{modulename}', [ModuleController::class, 'destroy'])
        ->middleware('can:modulenames.destroy')
        ->name('modulenames.destroy');
});
```

### 3. Update Permissions (database/seeders/CheckPermissionSeeder.php)

```php
// Add to seeder:
$modulePermissions = [
    'modulenames.view', 'modulenames.show', 'modulenames.create', 'modulenames.store',
    'modulenames.edit', 'modulenames.update', 'modulenames.destroy', 'modulenames.export',
];

// Then:
$allPermissions = array_merge($allPermissions, $modulePermissions);
```

---

## Validation Rules (Already in validation.ts)

All validation functions are pre-created in `resources/js/lib/validation.ts`:
- `validateZone()`
- `validateWoreda()`
- `validatePlace()`
- `validateStatusType()`
- `validateStatus()`
- `validateOperation()`
- `validateDriverPerformance()`
- `validateDriverSafety()`
- `validateRoutePlan()`
- `validateCustomer()`
- `validateOutsource()`

---

## Implementation Checklist

### For Each Module:

- [ ] **Frontend Pages** (4 pages):
  - [ ] Index.tsx
  - [ ] Create.tsx
  - [ ] Edit.tsx
  - [ ] Show.tsx

- [ ] **Backend**:
  - [ ] Update controller with Activity Log & search
  - [ ] Add export() method (optional but recommended)

- [ ] **Routes**:
  - [ ] Add permission-protected routes in routes/web.php

- [ ] **Permissions**:
  - [ ] Add permissions to CheckPermissionSeeder.php

- [ ] **Testing**:
  - [ ] Test CRUD operations
  - [ ] Test permissions
  - [ ] Test validation

---

## File Structure

```
resources/js/pages/
├── Regions/
│   ├── Index.tsx ✅
│   ├── Create.tsx ✅
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── Zones/
│   ├── Index.tsx (TODO)
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── Woredas/
│   ├── Index.tsx (TODO)
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── Places/
│   ├── Index.tsx (TODO)
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── StatusTypes/
│   ├── Index.tsx (TODO)
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── Statuses/
│   ├── Index.tsx (TODO)
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── Operations/
│   ├── Index.tsx (TODO)
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── Customers/
│   ├── Index.tsx ✅
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── DriverPerformances/
│   ├── Index.tsx (TODO)
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── DriverSafeties/
│   ├── Index.tsx (TODO)
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── RoutePlans/
│   ├── Index.tsx (TODO)
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
├── Outsources/
│   ├── Index.tsx (TODO)
│   ├── Create.tsx (TODO)
│   ├── Edit.tsx (TODO)
│   └── Show.tsx (TODO)
└── OutsourcePerformances/
    ├── Index.tsx (TODO)
    ├── Create.tsx (TODO)
    ├── Edit.tsx (TODO)
    └── Show.tsx (TODO)
```

---

## Quick Start: Copy-Paste Template for Simple Module

### Index.tsx Template (for Zone, Woreda, Place, StatusType, Status, Operation)
```typescript
// Just replace:
// - Regions → ModuleName
// - regions → modulename (plural lowercase)
// - RegionsIndex → ModuleNameIndex
// - Add extra fields to table as needed
```

### Create.tsx Template
```typescript
// Just replace:
// - RegionsCreate → ModuleNameCreate
// - validateRegion → validateModulename
// - Add form fields as per module
```

### Edit.tsx Template
```typescript
// Copy Create.tsx and:
// - Change useForm initial data
// - Add pre-population from props
// - Change post() → put()
// - Change button text to "Update"
```

### Show.tsx Template
```typescript
// Use CargoTypes/Show.tsx as base
// - Simplify sections for module
// - Remove unnecessary fields
// - Keep Activity Log
// - Add module-specific fields
```

---

## Environment Setup Complete ✅

All needed pieces are in place:
- ✅ Validation functions
- ✅ Permission hooks
- ✅ UI components
- ✅ AppLayout
- ✅ Activity Log component
- ✅ Toast system
- ✅ Delete confirmation dialog

**Just follow this template for each module and you'll have a complete, production-ready system!**
