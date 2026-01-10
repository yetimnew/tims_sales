# Plan: User → Driver → Driver-Truck Connection

## Current Situation

### Database Structure
1. **users** table
   - `id`, `name`, `email`, `password`
   - ❌ NO `driver_id` field
   
2. **drivers** table
   - `id`, `driverid`, `name`, `mobile`, `status`
   - ❌ NO `user_id` field
   
3. **driver_truck** table (pivot)
   - `id`, `driver_id`, `truck_id`
   - `is_attached` (boolean, default: true)
   - `status` (string, default: 'active')
   - `date_recived` (when assigned)
   - `date_detach` (when detached, NULL = still attached)
   - `deleted_at` (soft deletes)

### Active Truck Assignment Criteria
An active assignment means:
- `is_attached = 1` (true)
- `status = 'active'`
- `date_detach IS NULL`
- `deleted_at IS NULL`

---

## Solution Options

### Option A: Add `user_id` to `drivers` table (RECOMMENDED ✅)
**Pros:**
- One user can be linked to one driver (1:1 relationship)
- Driver can exist without user initially
- Easy to query: `User → Driver → ActiveTruckAssignment`

**Cons:**
- Requires migration
- Need to link existing drivers to users

**Implementation:**
```php
// Migration: add user_id to drivers
$table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');

// User Model
public function driver(): HasOne {
    return $this->hasOne(Driver::class);
}

// Driver Model  
public function user(): BelongsTo {
    return $this->belongsTo(User::class);
}
```

### Option B: Add `driver_id` to `users` table
**Pros:**
- Direct foreign key in users table
- Slightly simpler queries

**Cons:**
- User must have driver (not flexible)
- Harder to handle drivers without users

### Option C: Match by Email/Name (CURRENT - TEMPORARY)
**Pros:**
- No migration needed
- Quick fix

**Cons:**
- ❌ Not reliable (name/email might not match)
- ❌ Multiple drivers with same name
- ❌ Can't handle edge cases properly

---

## Recommended Implementation Plan

### Phase 1: Backend - Database & Models

#### Step 1.1: Create Migration
```php
// database/migrations/YYYY_MM_DD_HHMMSS_add_user_id_to_drivers_table.php
Schema::table('drivers', function (Blueprint $table) {
    $table->foreignId('user_id')->nullable()->after('id')
        ->constrained('users')
        ->onDelete('set null');
    
    $table->index('user_id');
    $table->unique('user_id'); // One driver per user
});
```

#### Step 1.2: Update Models
- **User Model**: Add `driver()` relationship
- **Driver Model**: Add `user()` relationship + `activeTruckAssignment()` scope

#### Step 1.3: Update API Controllers
- **DriverController::truck()**: Find driver via user, get active assignment
- **DriverStatusController**: Use proper User→Driver relationship

---

### Phase 2: Backend - API Endpoints

#### Step 2.1: Update `/api/driver/truck` endpoint
**Current Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Truck assignment not available..."
}
```

**New Response:**
```json
{
  "success": true,
  "data": {
    "assignment": {
      "id": 123,
      "truck": {
        "id": 45,
        "plate": "ABC-1234",
        "vehicle_type": "Heavy Truck",
        "model": "Volvo FH16",
        "year": 2020
      },
      "date_recived": "2024-01-15",
      "date_detach": null,
      "is_attached": true,
      "status": "active"
    },
    "driver": {
      "id": 12,
      "driverid": "DRV001",
      "name": "John Doe"
    }
  } | null,
  "status": "assigned" | "no_driver" | "no_assignment" | "assignment_removed"
}
```

**Status Values:**
- `"assigned"` - Active truck assignment exists
- `"no_driver"` - User not linked to driver
- `"no_assignment"` - Driver exists but no truck assigned
- `"assignment_removed"` - Assignment exists but is detached/inactive

---

### Phase 3: Flutter App - Models & Services

#### Step 3.1: Create Truck Models
- `Truck` model (id, plate, vehicle_type, model, year)
- `DriverTruckAssignment` model (assignment details)

#### Step 3.2: Update AuthService/DriverService
- Add method: `getCurrentTruckAssignment()`
- Cache assignment data

---

### Phase 4: Flutter App - UI Screens

#### Step 4.1: Truck Assignment Card Component
**Display on:**
- Dashboard Home Tab
- Profile Tab (optional)

**Shows:**
- Truck plate number
- Vehicle type/model
- Assignment date
- Assignment status badge

**States:**
1. **Active Assignment** ✅
   - Green badge "Assigned"
   - Truck details card
   - "View Details" button

2. **No Driver Linked** ⚠️
   - Warning card
   - Message: "Your account is not linked to a driver record. Please contact administrator."
   - Icon: `Icons.warning`

3. **No Assignment** 📭
   - Info card
   - Message: "You don't have an active truck assignment yet."
   - Icon: `Icons.local_shipping`
   - "Contact Admin" button (optional)

4. **Assignment Removed** ❌
   - Info card with history
   - Message: "Your truck assignment was removed on [date]"
   - Show previous truck details
   - Icon: `Icons.info`

#### Step 4.2: Truck Details Screen (Optional)
- Full truck information
- Assignment history
- Performance stats (if available)

---

## Implementation Steps (Priority Order)

### ✅ Step 1: Backend Migration & Models (HIGH PRIORITY)
1. Create migration to add `user_id` to `drivers` table
2. Update `User` model: Add `driver()` relationship
3. Update `Driver` model: Add `user()` relationship
4. Add helper method: `Driver::activeTruckAssignment()` scope

### ✅ Step 2: Update API Endpoint (HIGH PRIORITY)
1. Fix `DriverController::truck()` method
2. Return proper JSON response with all states
3. Handle all scenarios (no driver, no assignment, removed, active)

### ✅ Step 3: Update DriverStatusController (MEDIUM)
1. Use proper User→Driver relationship instead of name matching
2. Update `getDriverForUser()` to use relationship

### ✅ Step 4: Flutter Models (MEDIUM)
1. Create `Truck` model class
2. Create `DriverTruckAssignment` model class
3. Update existing `Driver` model if needed

### ✅ Step 5: Flutter Services (MEDIUM)
1. Update `ApiService` (if needed)
2. Create/Update `DriverService` with `getTruckAssignment()` method
3. Handle caching of assignment data

### ✅ Step 6: Flutter UI (HIGH PRIORITY)
1. Create `TruckAssignmentCard` widget
2. Add to Dashboard Home Tab
3. Handle all 4 states with proper UI
4. Create empty/error states

---

## Scenarios to Handle

### Scenario 1: User Not Linked to Driver
**Response:**
```json
{
  "success": true,
  "data": null,
  "status": "no_driver",
  "message": "Your account is not linked to a driver record. Please contact administrator."
}
```
**UI:** Warning card with message and contact info

### Scenario 2: Driver Exists, No Truck Assignment
**Response:**
```json
{
  "success": true,
  "data": {
    "driver": { "id": 12, "name": "John Doe", "driverid": "DRV001" }
  },
  "status": "no_assignment",
  "message": "You don't have an active truck assignment."
}
```
**UI:** Info card saying no assignment yet

### Scenario 3: Assignment Removed/Detached
**Response:**
```json
{
  "success": true,
  "data": {
    "driver": { ... },
    "last_assignment": {
      "truck": { "plate": "ABC-1234" },
      "date_detach": "2024-01-20",
      "reason": "Assignment ended"
    }
  },
  "status": "assignment_removed",
  "message": "Your truck assignment was removed on Jan 20, 2024"
}
```
**UI:** Info card showing previous assignment details

### Scenario 4: Active Assignment ✅
**Response:**
```json
{
  "success": true,
  "data": {
    "assignment": {
      "id": 123,
      "truck": {
        "id": 45,
        "plate": "ABC-1234",
        "vehicle_type": "Heavy Truck",
        "model": "Volvo FH16",
        "year": 2020,
        "status": "active"
      },
      "date_recived": "2024-01-15",
      "date_detach": null,
      "is_attached": true,
      "status": "active"
    },
    "driver": { ... }
  },
  "status": "assigned"
}
```
**UI:** Success card with truck details

---

## Next Steps

1. **Decide on Option A, B, or C** (Recommend Option A)
2. **Create migration** to link User and Driver
3. **Update backend API** to return proper truck assignment data
4. **Create Flutter models** and services
5. **Build Flutter UI** components for all scenarios
6. **Test all scenarios** thoroughly

---

## Questions to Answer Before Implementation

1. **How are drivers currently linked to users?** 
   - Manually in admin panel?
   - During user creation?
   - By matching email/name?

2. **What happens when assignment is removed?**
   - Should driver see history?
   - Should it auto-remove or just mark as detached?

3. **Can a driver have multiple truck assignments over time?**
   - Yes (keep history)
   - No (only one at a time) ✅ Current system supports this

4. **What information should be shown about the truck?**
   - Basic: Plate, Model, Type
   - Advanced: Maintenance status, Performance, etc.

---

## Estimated Timeline

- **Backend (Migration + API)**: 1-2 hours
- **Flutter Models + Services**: 30 minutes
- **Flutter UI Components**: 2-3 hours
- **Testing & Bug Fixes**: 1 hour
- **Total**: ~5-7 hours

