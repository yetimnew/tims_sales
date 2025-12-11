# Fleet Management Menu Guide

The Fleet Management section centralises everything needed to control trucks, drivers, assignments, fuel, safety, and cargo configuration. This guide explains how each menu works, the data it surfaces, and the supporting backend pieces so engineers and operators can keep the module aligned with business needs.

## 1. Navigation & Layout

- Main entry lives in the sidebar cluster defined in `resources/js/components/app-sidebar.tsx`. Inertia links (`<Link>`) keep navigation SPA-fast while preserving scroll and state, following the patterns documented at https://inertiajs.com/docs/v2/the-basics/pages and https://inertiajs.com/docs/v2/the-basics/links.
- All Fleet pages render inside `AppLayout` with the shared shell (top bar, breadcrumbs, responsive sidebar). Persistent layouts ensure filters, tabs, and dialogs are not remounted between visits.
- Permission gates wrap both the backend controllers and the React components via `usePermissions`. Users without the relevant abilities never see menu items or actions.

### Quick Reference Table

| Menu | Primary Screens | Key Actions | Required Permissions (minimum) |
| --- | --- | --- | --- |
| Trucks | `/trucks`, `/trucks/{id}` | CRUD, CSV export, deactivate, status audit | `trucks.view`, `trucks.show`, plus `trucks.create` / `trucks.edit` / `trucks.destroy` / `trucks.export`
| Drivers | `/drivers`, `/drivers/{id}` | CRUD, CSV export, activity timeline, grading | `drivers.view`, `drivers.show`, matching create/edit/delete permissions
| Driver-Truck Assignments | `/driver-trucks`, `/driver-trucks/{id}` | Assign, detach, grade, delete with safeguards | `driver-trucks.view`, `driver-trucks.show`, plus create/edit/destroy
| Vehicle Types | `/vehicletypes` | CRUD, usage analytics | `vehicletypes.view`, `vehicletypes.show`, extra abilities for create/edit/delete
| Fuel Records | `/fuel`, `/fuel/{id}` | CRUD, filter by truck/driver/type, export via reports | `fuel.view`, `fuel.show`, create/edit/destroy
| Driver Safety | `/driver-safety`, `/driver-safety/{id}` | CRUD, filter by incident/severity, cost tracking | `driver-safety.view`, `driver-safety.show`, create/edit/destroy
| Cargo Types | `/cargo-types` | CRUD, CSV export, equipment flags | `cargotypes.view`, `cargotypes.show`, create/edit/destroy/export

## 2. Shared UX & Backend Patterns

- **List pages** (`ListPageLayout`, `ListingStatsHeader`, `ListingFilterBar`, and `ListingTableShell`) drive every index view. They deliver consistent search, sorting, pagination, and responsive mobile fallbacks.
- **Metrics banners** summarise totals, active/available counts, or risk measures. Components use skeletons while data hydrates to reduce layout shift.
- **Row actions** rely on `ListingRowActionsMenu`, giving quick access to view, edit, and delete flows with permission-aware visibility.
- **Forms** are built with Inertia `useForm` objects or the `<Form>` helper. Validation errors flow back from Laravel Form Requests.
- **Events & activity logs**: write operations dispatch domain events (e.g. `FuelRecordCreated`) and log via Spatie activity log. Users can audit changes from show pages.
- **Testing**: each controller owns a focused feature test (`tests/Feature/...ControllerTest.php`) asserted with Inertia. High-risk calculations have unit tests under `tests/Unit`.

## 3. Menu Deep Dives

### 3.1 Trucks

- **Frontend**: `resources/js/Pages/Trucks/Index.tsx`, `Show.tsx`, `Create.tsx`, `Edit.tsx`. The index view surfaces fleet totals, filterable table, and CSV export. Show view organises data into Overview, Maintenance, Performance, and History tabs with activity logs and quick actions.
- **Backend**: `app/Http/Controllers/TruckController.php` aggregates insight cards (distance, fuel, cost), enforces permissions, and handles exports. Form requests (`StoreTruckRequest`, `UpdateTruckRequest`) standardise validation (uppercase plates, status rules).
- **Dependencies**: Vehicle types, driver assignments, maintenance, and performance records all feed the truck profile. Deleting or deactivating trucks is blocked if dependent data exists.
- **Testing**: `tests/Feature/TruckControllerTest.php` covers index filters, CRUD, exports, and logging. Truck grading metrics are validated by `tests/Unit/TruckGradeServiceTest.php`.
- **E2E**: `tests/e2e/truck-create.spec.ts` exercises the full create/show/verify flow via Playwright.

See `docs/features/trucks-readme.md` for a detailed operator/developer handbook.

### 3.2 Drivers

- **Frontend**: `resources/js/Pages/Drivers/Index.tsx` renders workforce stats (active vs inactive, gender mix) and offers quick filters for status, gender, and per-page counts. `Show.tsx` presents a rich profile: assignments timeline, performance summary, safety incidents, peer grading, and activity logs.
- **Backend**: `app/Http/Controllers/DriverController.php` delivers paginated data with metrics, handles CSV export, and powers grade reports. Form requests guarantee ID format, contact details, and employment dates.
- **Key Workflows**:
  - Add drivers with `drivers.create`; optional details like zone and mobile feed analytics.
  - Show view tabs: **Overview**, **Assignments** (driver-truck history), **Performance** (ton-km, efficiency), **Safety** (incident breakdown), **Activity**.
  - Delete operations are soft deletes and trigger audit logs.
- **Testing**: `tests/Feature/DriverControllerTest.php` verifies navigation, filtering, CRUD, export, and activity logging.

### 3.3 Driver-Truck Assignments

- **Frontend**: `resources/js/Pages/DriverTrucks/Index.tsx` monitors live attachments, free drivers/trucks, and supports filtering by attachment status. `Show.tsx` dives into assignment health with grading categories (performance, efficiency, consistency), recent performances, and activity history.
- **Backend**: `app/Http/Controllers/DriverTruckController.php` enforces business rules—soft delete blocked if linked performances or fuel records exist. Updates capture detach reasons and dates.
- **Key Points**:
  - Assignments require both driver and truck to be active.
  - Grading overlays take data from performance and fuel services.
  - Cleanup dialogs warn when dependencies prevent deletion.
- **Testing**: `tests/Feature/DriverTruckControllerTest.php` checks delete safeguards, event dispatch on CRUD, and success responses.

### 3.4 Vehicle Types

- **Frontend**: `resources/js/Pages/VehicleTypes/Index.tsx` visualises how truck inventory distributes across types, showing counts for total, active, and empty buckets. Sorting by truck count highlights underutilised categories.
- **Backend**: `app/Http/Controllers/VehicleTypeController.php` populates metrics via eager-loaded truck counts and manages CRUD. Validation ensures unique names and clean descriptions.
- **Testing**: `tests/Feature/VehicleTypeControllerTest.php` asserts event dispatch and permission checks.

### 3.5 Fuel Records

- **Frontend**: `resources/js/Pages/Fuel/Index.tsx` offers multi-dimensional filters (fuel type, truck, driver) and a metrics header with total litres, spend, and average price. Badges reveal fuel types at a glance.
- **Backend**: `app/Http/Controllers/FuelController.php` links fuel entries to assignments, recalculates totals, and emits events for downstream analytics.
- **Key Workflows**:
  - Creating records requires an active driver-truck assignment; total cost auto-computes.
  - Editing updates aggregates and triggers `FuelRecordUpdated`.
  - Deletion cleans up and fires `FuelRecordDeleted`.
- **Testing**: `tests/Feature/FuelControllerTest.php` fakes events to ensure create/update/delete signals fire correctly.

### 3.6 Driver Safety

- **Frontend**: `resources/js/Pages/DriverSafety/Index.tsx` tracks incidents with severity and type filters. Metrics highlight total accidents, warnings, and damage spend. Badges communicate severity (critical/major/minor) visually.
- **Backend**: `app/Http/Controllers/DriverSafetyController.php` enforces validation (incident dates, severity enums) and dispatches events for each lifecycle change.
- **Usage Tips**:
  - Capture detailed descriptions and optional damage costs to support insurance workflows.
  - Severity and type filters support rapid risk reviews during audits.
- **Testing**: `tests/Feature/DriverSafetyControllerTest.php` covers create/update/delete event emission.

### 3.7 Cargo Types

- **Frontend**: `resources/js/Pages/CargoTypes/Index.tsx` catalogues cargo classifications with category badges, equipment requirements, and weight per cubic metre metrics. Export button honours current filters.
- **Backend**: `app/Http/Controllers/CargoTypeController.php` stores metadata and ensures enumeration-backed categories (`App
\Enums\CargoCategory`).
- **Testing**: `tests/Feature/CargoTypeControllerTest.php` validates event dispatch and permission enforcement.

## 4. Cross-Cutting Permissions & Policies

- Permissions are seeded in `database/seeders/CheckPermissionSeeder.php`. Ensure new roles include the relevant `view`/`show` abilities before granting access.
- Controllers rely on `authorizeResource` or manual `can()` checks; front-end components double-check with `usePermissions` to hide buttons.
- For new routes, add policies and update Wayfinder so generated clients mirror backend rules.

## 5. Operational Runbooks

1. **Data Seeding**: `php artisan migrate --seed` provisions vehicle types, cargo categories, sample drivers/trucks, and permissions.
2. **Regenerate Wayfinder** after route changes: `php artisan wayfinder:generate`.
3. **Formatting & Linting**:
   - PHP: `vendor/bin/pint --dirty`
   - JS/TS: `npm run lint:check` and `npm run format:check`
4. **Targeted Tests**:
   - Drivers: `php artisan test --filter=DriverControllerTest`
   - Driver-Truck assignments: `php artisan test --filter=DriverTruckControllerTest`
   - Fuel: `php artisan test --filter=FuelControllerTest`
   - Safety: `php artisan test --filter=DriverSafetyControllerTest`
   - Cargo Types: `php artisan test --filter=CargoTypeControllerTest`
   - Vehicle Types: `php artisan test --filter=VehicleTypeControllerTest`

## 6. Extending the Module

- Reuse `ListPageLayout` and shared listing components for new fleet screens to maintain consistent UX.
- When introducing new metrics, add backend aggregations and expose them through props before updating the React cards.
- Prefer emitting events (mirroring existing create/update/delete flows) so analytics listeners remain in sync.
- Update `resources/js/components/app-sidebar.tsx` with required permissions and icons for any new fleet sub-menus, and run tests to ensure visibility logic still works.

Keep this guide alongside `docs/features/trucks-readme.md` and the operations/performance documentation so product, operations, and engineering teams share a single vocabulary when discussing the fleet domain.
