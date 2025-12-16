# Controller Refactoring Guide - Step by Step

This guide shows how to refactor an existing controller to match the TruckController standards.

## Example: Refactoring DriverController

### BEFORE (Current State - Issues)

```php
public function store(Request $request)
{
    try {
        $validated = $request->validate([
            'driverid' => 'required|string|max:255|unique:drivers',
            'name' => 'required|string|max:255',
            // ... more validation ...
        ]);

        $driver = Driver::create($validated);
        event(new DriverCreated($driver, Auth::user()));
        
        // ❌ Issue 1: Only clearing some caches
        $this->driverMetrics->clearCache();
        Cache::forget('drivers.status_options');
        
        // ❌ Issue 2: No explicit success message with identifier
        return redirect()->route('drivers.index')
            ->with('success', 'Driver created successfully.');

    } catch (Exception $e) {
        // ❌ Issue 3: No error logging
        return back()->withErrors(['error' => 'Failed to create driver. Please try again.']);
    }
}
```

### AFTER (Refactored - Best Practice)

```php
/**
 * Store a newly created resource in storage.
 */
public function store(StoreDriverRequest $request)
{
    try {
        $driver = Driver::create($request->validated());

        // Clear all related caches systematically
        $this->driverMetrics->clearCache();
        Cache::forget('drivers.status_options');
        Cache::forget('drivers.gender_options');
        Cache::forget('fuel_records.driver_options');
        Cache::forget('driver_safety.driver_options');
        Cache::forget('reports.performance_all.driver_options');
        Cache::forget('reports.performance_by_driver.driver_options');

        // Dispatch event for audit trail
        event(new DriverCreated($driver, Auth::user()));

        // Explicit message with driver identifier
        return redirect()->route('drivers.index')
            ->with('success', sprintf('Driver %s created successfully.', $driver->name));

    } catch (Exception $e) {
        // Log with context for debugging
        $this->logError('store', 'Driver', $e, [
            'created_by' => Auth::id(),
            'driverid' => $request->input('driverid'),
        ]);
        
        return back()->withErrors(['error' => 'Failed to create driver. Please try again.']);
    }
}
```

---

## Step-by-Step Refactoring Checklist

### Step 1: Create Form Request Classes

**File**: `app/Http/Requests/StoreDriverRequest.php`

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDriverRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('drivers.create');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'driverid' => 'required|string|max:255|unique:drivers',
            'name' => 'required|string|max:255',
            'sex' => 'required|string|in:male,female',
            'birthdate' => 'nullable|date',
            'zone' => 'nullable|string|max:255',
            'woreda' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'housenumber' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:255',
            'hireddate' => 'nullable|date',
            'status' => 'required|string|in:active,inactive',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'driverid.unique' => 'A driver with this ID already exists.',
            'driverid.required' => 'Driver ID is required.',
            // ... more messages ...
        ];
    }
}
```

**File**: `app/Http/Requests/UpdateDriverRequest.php`

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('drivers.edit');
    }

    public function rules(): array
    {
        return [
            'driverid' => 'required|string|max:255|unique:drivers,driverid,'.$this->driver->id,
            'name' => 'required|string|max:255',
            'sex' => 'required|string|in:male,female',
            'birthdate' => 'nullable|date',
            'zone' => 'nullable|string|max:255',
            'woreda' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'housenumber' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:255',
            'hireddate' => 'nullable|date',
            'status' => 'required|string|in:active,inactive',
        ];
    }
}
```

### Step 2: Update Constructor - Add Dependencies

**BEFORE**:
```php
public function __construct(
    private DriverMetricsService $driverMetrics,
    private DriverGradeService $driverGrade,
    private DriverIndexService $driverIndexService,
) {}
```

**AFTER** (No change needed - already good!) ✅

### Step 3: Update Index Method - Use Service Layer

**BEFORE**:
```php
public function index(Request $request): Response
{
    // ... complex query building ...
    return Inertia::render('Drivers/Index', [
        'drivers' => $drivers,
        'filters' => $filters,
        // ... lots of data ...
    ]);
}
```

**AFTER**:
```php
/**
 * Display a listing of the resource.
 */
public function index(Request $request): Response
{
    try {
        $result = $this->driverIndexService->getIndexResult($request);
        return Inertia::render('Drivers/Index', $result->toInertia());
    } catch (Exception $e) {
        $this->logError('index', 'Driver', $e);
        return back()->withErrors(['error' => 'Failed to load drivers.']);
    }
}
```

### Step 4: Update Create Method - Use Cache

**BEFORE**:
```php
public function create(): Response
{
    return Inertia::render('Drivers/Create');
}
```

**AFTER**:
```php
/**
 * Show the form for creating a new resource.
 */
public function create(): Response
{
    $statusOptions = Cache::remember('drivers.status_options', 3600, function () {
        return [
            ['label' => 'Active', 'value' => 'active'],
            ['label' => 'Inactive', 'value' => 'inactive'],
        ];
    });

    return Inertia::render('Drivers/Create', [
        'statusOptions' => $statusOptions,
    ]);
}
```

### Step 5: Update Store Method - Replace Inline Validation

**BEFORE**:
```php
public function store(Request $request)
{
    try {
        $validated = $request->validate([
            'driverid' => 'required|string|max:255|unique:drivers',
            // ... inline validation ...
        ]);

        $driver = Driver::create($validated);
        event(new DriverCreated($driver, Auth::user()));
        
        $this->driverMetrics->clearCache();
        Cache::forget('drivers.status_options');
        
        return redirect()->route('drivers.index')
            ->with('success', 'Driver created successfully.');

    } catch (Exception $e) {
        return back()->withErrors(['error' => 'Failed to create driver. Please try again.']);
    }
}
```

**AFTER**:
```php
/**
 * Store a newly created resource in storage.
 */
public function store(StoreDriverRequest $request)
{
    try {
        $driver = Driver::create($request->validated());

        // Clear all related caches
        $this->driverMetrics->clearCache();
        Cache::forget('drivers.status_options');
        Cache::forget('drivers.gender_options');
        Cache::forget('fuel_records.driver_options');
        Cache::forget('driver_safety.driver_options');
        Cache::forget('reports.performance_all.driver_options');
        Cache::forget('reports.performance_by_driver.driver_options');

        // Dispatch event for audit trail
        event(new DriverCreated($driver, Auth::user()));

        return redirect()->route('drivers.index')
            ->with('success', sprintf('Driver %s created successfully.', $driver->name));

    } catch (Exception $e) {
        $this->logError('store', 'Driver', $e, [
            'created_by' => Auth::id(),
            'driverid' => $request->input('driverid'),
        ]);
        
        return back()->withErrors(['error' => 'Failed to create driver. Please try again.']);
    }
}
```

### Step 6: Update Show Method - Add Activity Logs

**BEFORE**:
```php
public function show(Driver $driver): Response
{
    $driver->load(['trucks', 'performanceRecords']);

    return Inertia::render('Drivers/Show', [
        'driver' => $driver,
        // ... no activity logs ...
    ]);
}
```

**AFTER**:
```php
/**
 * Display the specified resource.
 */
public function show(Driver $driver): Response
{
    try {
        $driver->load(['trucks', 'performanceRecords', 'safetyRecords']);

        // Get activity logs using base controller method
        $activityLogs = $this->getActivityLogs($driver, limit: 50);

        return Inertia::render('Drivers/Show', [
            'driver' => $driver,
            'activityLogs' => $activityLogs,
            // ... other data ...
        ]);
    } catch (Exception $e) {
        $this->logError('show', 'Driver', $e);
        return back()->withErrors(['error' => 'Failed to load driver details.']);
    }
}
```

### Step 7: Update Edit Method - Cache Options

**BEFORE**:
```php
public function edit(Driver $driver): Response
{
    return Inertia::render('Drivers/Edit', ['driver' => $driver]);
}
```

**AFTER**:
```php
/**
 * Show the form for editing the specified resource.
 */
public function edit(Driver $driver): Response
{
    $statusOptions = Cache::remember('drivers.status_options', 3600, function () {
        return [
            ['label' => 'Active', 'value' => 'active'],
            ['label' => 'Inactive', 'value' => 'inactive'],
        ];
    });

    return Inertia::render('Drivers/Edit', [
        'driver' => $driver,
        'statusOptions' => $statusOptions,
    ]);
}
```

### Step 8: Update Update Method - Use Form Request & Track Changes

**BEFORE**:
```php
public function update(Request $request, Driver $driver)
{
    try {
        $validated = $request->validate([
            // ... inline validation ...
        ]);

        $driver->update($validated);
        
        $this->driverMetrics->clearCache();
        Cache::forget('drivers.status_options');
        
        return redirect()->route('drivers.index')
            ->with('success', 'Driver updated successfully.');

    } catch (Exception $e) {
        return back()->withErrors(['error' => 'Failed to update driver. Please try again.']);
    }
}
```

**AFTER**:
```php
/**
 * Update the specified resource in storage.
 */
public function update(UpdateDriverRequest $request, Driver $driver)
{
    try {
        // Capture original values before update
        $original = $this->normalizeAttributes($driver->getOriginal());
        
        $driver->update($request->validated());
        
        // Format changes for audit trail
        $changes = $this->formatChanges($original, $this->normalizeAttributes($driver->getChanges()));

        // Clear related caches
        $this->driverMetrics->clearCache();
        Cache::forget('drivers.status_options');
        Cache::forget('drivers.gender_options');
        Cache::forget('fuel_records.driver_options');
        Cache::forget('driver_safety.driver_options');
        Cache::forget('reports.performance_all.driver_options');
        Cache::forget('reports.performance_by_driver.driver_options');

        // Only dispatch event if there were actual changes
        if (! empty($changes)) {
            event(new DriverUpdated($driver, $changes, Auth::user()));
        }

        return redirect()->route('drivers.index')
            ->with('success', sprintf('Driver %s updated successfully.', $driver->name));

    } catch (Exception $e) {
        $this->logError('update', 'Driver', $e);
        return back()->withErrors(['error' => 'Failed to update driver. Please try again.']);
    }
}
```

### Step 9: Update Destroy Method - Track Deleted Data

**BEFORE**:
```php
public function destroy(Driver $driver)
{
    try {
        $driver->delete();
        
        $this->driverMetrics->clearCache();
        Cache::forget('drivers.status_options');
        
        return redirect()->route('drivers.index')
            ->with('success', 'Driver deleted successfully.');

    } catch (Exception $e) {
        return back()->withErrors(['error' => 'Failed to delete driver. Please try again.']);
    }
}
```

**AFTER**:
```php
/**
 * Remove the specified resource from storage.
 */
public function destroy(Driver $driver)
{
    try {
        // Capture data before deletion for audit trail
        $attributes = $this->normalizeAttributes($driver->toArray());
        $driverId = $driver->id;
        $driverName = $driver->name;

        $driver->delete();

        // Clear related caches
        $this->driverMetrics->clearCache();
        Cache::forget('drivers.status_options');
        Cache::forget('drivers.gender_options');
        Cache::forget('fuel_records.driver_options');
        Cache::forget('driver_safety.driver_options');
        Cache::forget('reports.performance_all.driver_options');
        Cache::forget('reports.performance_by_driver.driver_options');

        // Dispatch event with deleted data for audit trail
        event(new DriverDeleted($driverId, $driverName, $attributes, Auth::user()));

        return redirect()->route('drivers.index')
            ->with('success', sprintf('Driver %s deleted successfully.', $driverName));

    } catch (Exception $e) {
        $this->logError('destroy', 'Driver', $e);
        return back()->withErrors(['error' => 'Failed to delete driver. Please try again.']);
    }
}
```

### Step 10: Inherit from BaseResourceController

**BEFORE**:
```php
class DriverController extends Controller
{
    public function __construct(...) {}
    
    private function trimPagination(...) { /* ... */ }
    private function toCarbon(...) { /* ... */ }
    // duplicate methods
}
```

**AFTER**:
```php
class DriverController extends BaseResourceController
{
    public function __construct(
        private DriverMetricsService $driverMetrics,
        private DriverGradeService $driverGrade,
        private DriverIndexService $driverIndexService,
    ) {}
    
    // No need to duplicate helper methods!
    // Use inherited: $this->formatPagination()
    //              $this->toCarbon()
    //              $this->getActivityLogs()
    //              $this->normalizeAttributes()
    //              $this->formatChanges()
    //              $this->logError()
}
```

---

## Testing After Refactoring

### Unit Tests
```bash
php artisan test tests/Unit/Http/Controllers/DriverControllerTest.php
```

### Feature Tests
```bash
php artisan test tests/Feature/Http/Controllers/DriverControllerTest.php
```

### Manual Testing Checklist
- [ ] Create new driver - verify success message and cache cleared
- [ ] Edit driver - verify changes logged and event dispatched
- [ ] Delete driver - verify data captured and event dispatched
- [ ] Index page - verify pagination works and filters apply
- [ ] Activity logs - verify show page displays logs correctly
- [ ] Error cases - try invalid data, verify error messages

---

## Common Pitfalls to Avoid

### ❌ Mistake 1: Forgetting Cache Invalidation
```php
// WRONG - only clearing one cache
Cache::forget('drivers.status_options');

// RIGHT - clearing all related caches
Cache::forget('drivers.status_options');
Cache::forget('drivers.gender_options');
Cache::forget('fuel_records.driver_options');
```

### ❌ Mistake 2: Not Tracking Changes
```php
// WRONG - no change tracking
$driver->update($request->validated());
event(new DriverUpdated($driver, Auth::user()));

// RIGHT - track what changed
$original = $this->normalizeAttributes($driver->getOriginal());
$driver->update($request->validated());
$changes = $this->formatChanges($original, $this->normalizeAttributes($driver->getChanges()));
event(new DriverUpdated($driver, $changes, Auth::user()));
```

### ❌ Mistake 3: Not Using Service Layer
```php
// WRONG - complex query in controller
public function index(Request $request): Response
{
    $drivers = Driver::with('trucks')
        ->where('status', $request->input('status'))
        // ... 50 lines of query building ...
        ->paginate();
}

// RIGHT - use service
public function index(Request $request): Response
{
    $result = $this->driverIndexService->getIndexResult($request);
    return Inertia::render('Drivers/Index', $result->toInertia());
}
```

### ❌ Mistake 4: Vague Error Messages
```php
// WRONG
return back()->withErrors(['error' => 'Failed to create driver.']);

// RIGHT - with context
return redirect()->route('drivers.index')
    ->with('success', sprintf('Driver %s created successfully.', $driver->name));
```

---

## Quick Refactoring Timeline

| Step | Time | Task |
|------|------|------|
| 1 | 15 min | Create form requests |
| 2 | 10 min | Update constructor |
| 3 | 20 min | Refactor index method |
| 4 | 15 min | Update CRUD methods |
| 5 | 10 min | Inherit from BaseController |
| 6 | 30 min | Test all methods |
| **Total** | **100 min** | **1 controller** |

---

## Success Criteria

After refactoring:

- ✅ All methods have docblocks
- ✅ All methods wrapped in try-catch
- ✅ Form requests used instead of inline validation
- ✅ Events dispatched for all mutations
- ✅ Related caches cleared systematically
- ✅ Activity logs displayed on show page
- ✅ Change tracking implemented
- ✅ Error logging with context
- ✅ All tests pass
- ✅ Code follows TruckController pattern

---

**Status**: Ready to implement  
**Priority**: High  
**Effort**: Medium (1-2 hours per controller)

