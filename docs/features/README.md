# Operations & Performance Guide - TIMS

This document focuses exclusively on the Operations, Performance, and Outsource Performance capabilities inside the Transport Information Management System (TIMS). Use it as the single reference for domain language, user flows, metrics, validation rules, and supporting assets.

## 1. Module Overview

- **Operations** define contractual work orders: who (customer/vendor), what (cargo type and volume), where (destination scope), and the commercial envelope (tariff, kilometres, service type).
- **Performances** capture internal fleet execution against an operation, tying a driver-truck assignment to a dispatch and tracking tonnage, distance, costs, and trip status.
- **Outsource Performances** record similar dispatches executed by third-party vendors, adding vendor benchmarking, spend control, and comparative analytics.
- The three modules share lifecycle stages (plan → dispatch → settle) and common KPIs (ton-km, load factor, cost per ton-km) so analysts can evaluate in-house and outsourced delivery on the same footing.

```text
Operation
 ├─ Performance (internal fleet)
 │    └─ driver_truck → driver + truck + places
 └─ OutsourcePerformance (vendor network)
      └─ outsource vendor → places
```

## 2. Domain Relationships

- `Operation` has many `Performance` and many `OutsourcePerformance` records (`app/Models/Operation.php`).
- `Performance` belongs to `Operation`, `DriverTruck`, `Place` (origin/destination), `CargoType`, and `User` (`app/Models/Performance.php`).
- `OutsourcePerformance` belongs to `Outsource`, `Operation`, `Place` (from/to), and `User` (`app/Models/OutsourcePerformance.php`).
- Enumerations coordinate configuration:
  - `App\Enums\CargoServiceType`: `relief`, `commercial`.
  - `App\Enums\OperationDestinationScope`: `region`, `zone`, `woreda`, `place`.
- Activity logging is enabled on `Operation` and `Performance` for auditability via the Spatie activity log package.

## 3. Data Model Cheat Sheet

### 3.1 Operation

| Field | Type | Notes |
| --- | --- | --- |
| `operationid` | string | Unique human-readable reference; surfaced throughout the UI. |
| `customer_id` | FK | Required active customer. |
| `cargo_type_id` | FK | Links to `CargoType`; contextualises tonnage. |
| `cargo_service_type` | enum | `relief` or `commercial`; affects reporting segments. |
| `volume` | decimal(12,2) | Planned tonnage commitment. |
| `km` | decimal(12,2) | Planned kilometres for entire contract. |
| `tariff` | decimal(12,2) | Birr per ton-km revenue assumption. |
| `status` | string | Typically `active`, `inactive`. |
| `closed` | boolean | Marks lifecycle completion; hides in open-operation filters. |
| `destination_scope` | enum | Governs `destination_reference_type`/`_id`. |
| `startdate` / `enddate` | date | Contract window. |

### 3.2 Performance (Internal Fleet)

| Field | Type | Highlights |
| --- | --- | --- |
| `load_phase` | string | `main` or `return`; scopes analytics. |
| `load_completion` | string | `full`, `partial`; informs utilisation dashboards. |
| `FOnumber` | string | Force Order number; normalised to uppercase during validation. |
| `DateDispach` | date | Dispatch date; must be `<= today`. |
| `orgion_id` / `destination_id` | FK | Distinct places; enforced by validation. |
| `DistanceWCargo` | decimal(10,2) | Kilometres under load. |
| `DistanceWOCargo` | decimal(10,2) | Kilometres without load (deadhead). |
| `CargoVolumMT` | decimal(8,2) | Recorded payload in metric tonnes. |
| `tonkm` | decimal(12,2) | Optional override, otherwise recomputed in front-end. |
| `fuelInBirr`, `fuelInLitter`, `perdiem`, `other` | decimal | Capture direct trip costs. |
| `satus` | string | Typo retained for backwards compatibility; values `active`, `inactive`, `completed`, `cancelled`. |
| `is_returned` | bool | Flag for closed loop; controls completion counters. |
| `returned_date` | date | Must be `>= DateDispach`. |

### 3.3 OutsourcePerformance (Vendor Trips)

| Field | Type | Notes |
| --- | --- | --- |
| `outsource_id` | FK | Required vendor. |
| `operation_id` | FK | Optional back-reference to contract; enables margin comparison. |
| `trip_number` | string | Vendor-facing reference; used for navigation. |
| `dispatch_date` | date | Travel date. |
| `from_place_id` / `to_place_id` | FK | Route definition. |
| `distance_km` | decimal(10,2) | Travelled kilometres. |
| `cargo_volume_mt` | decimal(8,2) | Payload tonnage. |
| `tonkm` | decimal(12,2) | Productivity metric. |
| `cost` | decimal(12,2) | Invoice amount. |
| `status` | string | Common values `completed`, `in_transit`, `cancelled`. |
| `remarks` | text | Analyst commentary. |

## 4. Lifecycle Workflows

### 4.1 Operation Lifecycle

1. **Create** (`operations.create` → `operations.store`): capture customer, cargo type, destination scope, and contract economics. Validation lives in `App\Http\Requests\Operations\StoreOperationRequest`.
2. **Track** (`operations.index`): filterable list with delivered volume progress via `withSum('performances', 'CargoVolumMT')`.
3. **Analyse** (`operations.show`): aggregates internal performances to compute tonnage completion, return rate, ton-km completion, cost per ton-km, and tariff-based revenue vs. margin.
4. **Close** (`operations.update` or `operations.deactivate`): mark `closed = true` once commitments are met; triggers open vs. closed segmentation.

### 4.2 Internal Trip Capture

1. Dispatcher navigates to `performances.create` and selects an active operation, driver-truck assignment, origin, and destination.
2. Form request (`App\Http\Requests\StorePerformanceRequest`) enforces temporal sanity (dispatch date not in future, return date after dispatch) and numeric bounds.
3. Once stored, the show view (`resources/js/Pages/Performances/Show.tsx`) calculates derived metrics client-side: total distance, ton-km, cost per km, load factor, empty backhaul share, and revenue/margin using operation tariff.
4. Activity log records creation/update for audit. Analysts access historical records through operation insights (recent trips timeline, status breakdown pie chart) embedded in the show page props.

### 4.3 Outsource Trip Capture

1. Vendor controller (`OutsourcePerformanceController@create`) provides dropdowns for vendor, operation, and places, plus status options.
2. Store action validates numerics and normalises payload before persisting. `preparePayload` handles optional ton-km recomputation.
3. Index page (`OutsourcePerformances/Index`) surfaces metrics (total cost, distance, cargo, active count) and supports search, vendor filtering, date range filters, sorting, and pagination.
4. Show page (`resources/js/Pages/OutsourcePerformances/Show.tsx`) highlights trip snapshot (distance, cargo, ton-km, cost), vendor benchmarks (totals and averages across history), and recent dispatch timeline. A dedicated narrative for analysts lives in `docs/features/outsource-performance-show.md`.

## 5. UI Surfaces

### 5.1 Operations

- **Index** (`resources/js/Pages/Operations/Index.tsx`): throttle-protected route, advanced filters, completion badges, and delivered vs. planned tonnage bars.
- **Show**: merges `operation` payload with `performanceInsights` comprising totals, financial metrics, economics, trends, and tonnage breakdown. Concepts such as return rate, load factor, empty backhaul share, and ton-km completion rate are derived in controller queries.
- **Create/Edit**: dynamic destination resolution based on `OperationDestinationScope`, cargo type selection, and tariff entry.

### 5.2 Performances

- **Index**: emphasises FO numbers, driver-truck pairings, and status chips; includes CSV export with `performances.export` permission.
- **Show** (`Performances/Show.tsx`): rich analytics cards covering trip economics (ton-km, cost per ton-km, gross margin, yield per ton/km), operational KPIs (load factor, empty share, distance mix), and contribution to the parent operation (tonnage share, planned contribution). Activity feed uses `ActivityLogTable`.
- **Forms**: built with Inertia forms plus backend validation; load completion and phase choices ensure canonical values.

### 5.3 Outsource Performances

- **Index**: quick metrics banner, vendor filter drop-down, dispatch date range, per-page selection (10/15/25/50). Sorting defaults to most recent dispatch.
- **Show**: dual-section layout—trip snapshot cards and vendor benchmark cards. Status badge styling adapts to known states (`completed`, `in_transit`, `cancelled`). Supports edit/delete actions gated by `outsource-performances.edit` and `.destroy` permissions.

## 6. KPI and Formula Reference

| Metric | Formula | Module |
| --- | --- | --- |
| Ton-Kilometre | `distance_km × cargo_mass_MT` | All trip records |
| Load Factor | `(DistanceWCargo ÷ (DistanceWCargo + DistanceWOCargo)) × 100` | Performance Show |
| Empty Backhaul Share | `(DistanceWOCargo ÷ total_distance) × 100` | Operation & Performance insights |
| Cost per Ton-Km | `total_cost ÷ ton_km` | Performance & Operation financials |
| Average Ton per Trip | `total_tonnage ÷ total_trips` | Operation Show |
| Tariff Revenue | `ton_km × tariff` | Operation Show & Performance Show |
| Gross Margin | `revenue − total_cost` | Operation Show & Performance Show |
| Vendor Average Ton-Km | `Σ vendor tonkm ÷ vendorTripCount` | Outsource Show |
| Vendor Average Cost | `Σ vendor cost ÷ vendorTripCount` | Outsource Show |

### Interpretation Tips

- Negative gross margin or cost per ton-km variance above benchmark flags cost drift; review input costs and FO tariff adherence.
- Low load factor or high empty backhaul share signals routing inefficiency; coordinate with logistics planning.
- Compare outsource average cost against internal cost per ton-km to inform make-vs-buy decisions.

## 7. Validation and Data Integrity

- **Operations** (`StoreOperationRequest` / `UpdateOperationRequest`): ensures destination exists for chosen scope, tariff/km/volume are non-negative, and cargo service type matches enum values.
- **Performances** (`StorePerformanceRequest`, `UpdatePerformanceRequest`): enforces origin ≠ destination, dispatch date not in future, numeric bounds for distances and costs, and status membership. `prepareForValidation` uppercases FO numbers and trims comments.
- **Outsource Performances** (inline validation in controller): verifies vendor, operation, and places exist; all numerics are optional but must be non-negative when provided.
- Routine data integrity checks:
  - Use activity logs to trace changes when investigating anomalies.
  - Reconcile ton-km totals with planned operation volume via operation show page completion rates.
  - Encourage analysts to append context in `remarks`/`comment` fields for later audits.

## 8. Permissions and Routes

| Area | Route Name | HTTP | Permission |
| --- | --- | --- | --- |
| Operations list | `operations.index` | GET | `operations.view` |
| Operations create | `operations.create`/`store` | GET/POST | `operations.create`, `operations.store` |
| Operations detail | `operations.show` | GET | `operations.show` |
| Operations edit | `operations.edit`/`update` | GET/PUT | `operations.edit`, `operations.update` |
| Operations export | `operations.export` | GET | `operations.export` |
| Performances list | `performances.index` | GET | `performances.view` |
| Performance store | `performances.store` | POST | `performances.store` (rate-limited `throttle:15,1`) |
| Performance detail | `performances.show` | GET | `performances.show` |
| Performance export | `performances.export` | GET | `performances.export` |
| Outsource performances | Resource routes | REST | Default resource middleware (consider policy if tightening access) |

Use Wayfinder-generated clients (`@/actions/...`) where available to keep front-end routing type-safe. Regenerate with `php artisan wayfinder:generate` after changing routes.

## 9. Testing and QA

- **Outsource show coverage**: `tests/Feature/OutsourcePerformance/ShowOutsourcePerformanceTest.php` verifies vendor metrics, recent trips, and payload fields.
- **Model scaffolding**: `tests/Unit/TimsModelTest.php` covers `Operation` relationships and attribute casting.
- **Performance module smoke**: `tests/Feature/Performance/PerformanceTest.php` emphasises response times for key fleet endpoints; extend when adding heavy analytics.
- Targeted regression commands:

```bash
php artisan test --filter=OutsourcePerformance
php artisan test --filter=Operation
```

- Add scenario tests when introducing new KPIs (e.g., cost variance alerts) to ensure controller aggregates remain stable.

## 10. Extensibility Roadmap

- **Margin Bridge**: Surface operation-level gross margin percentages next to outsource averages to expose profitability gaps.
- **Automated Alerts**: Queue notifications when cost-per-ton-km exceeds tariff-derived thresholds or when load factor drops below tolerance.
- **Vendor Scorecards**: Persist rolling averages (e.g., last 10 trips) for outsource partners to inform contract renewals.
- **Data Quality Dashboards**: Track missing ton-km values, zero-tonnage trips, or duplicate FO numbers, feeding back into dispatcher coaching.

## 11. Supporting References

- Outsource show interpretation deep dive: `docs/features/outsource-performance-show.md`.
- Front-end sources: `resources/js/Pages/Operations`, `resources/js/Pages/Performances`, `resources/js/Pages/OutsourcePerformances`.
- Backend controllers: `app/Http/Controllers/OperationController.php`, `PerformanceController.php`, `OutsourcePerformanceController.php`.

**Last Updated**: November 17, 2025  
**Maintainer**: Operations & Analytics Team
