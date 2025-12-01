# Truck Grading Guide

This guide explains how trucks are graded, how snapshots are stored, and how to work with the reporting and settings surfaces. Use it as the source of truth when creating trucks, tuning weights, or triaging grading issues.

---

## Quick Facts

- Backend entry points: `app/Services/TruckGradeService.php`, `app/Services/TruckGradeSnapshotService.php`
- Snapshot store: `truck_grade_snapshots` via `App\Models\TruckGradeSnapshot`
- Settings source: `App\Models\TruckGradingSetting` (weights, thresholds, peer sample)
- Manual recalculation endpoint: `POST /settings/truck-grading/recalculate` (expects CSRF header/cookie)
- Report UI: `resources/js/pages/Reports/TruckGrading.tsx`
- Settings UI: `resources/js/pages/settings/truck-grading.tsx`
- Permissions: view (`trucks.show`), update (`trucks.update`)
- Validation & tests: `tests/Feature/Reports/TruckGradingReportTest.php`, `tests/Feature/TruckGradingSnapshotTest.php`

---

## 1. Domain Overview

### 1.1 Core Models

- **Truck** – Primary asset; new trucks are created through the standard fleet module. Every recalculation reads from `trucks` to build metrics.
- **TruckGradingSetting** – Stores configurable weights, grade thresholds, and peer sample size. Defaults live in `TruckGradingSetting::defaultWeights()` and `::defaultGradeThresholds()`.
- **TruckGradeSnapshot** – Holds the calculated grade for a truck on a given snapshot date plus the filters used to generate it. Arrays are stored as JSON and decoded automatically through casts.

### 1.2 Services & Jobs

- **TruckGradeService** – Pure scoring engine. It gathers performance, maintenance, and status metrics, compares trucks against their peers, and returns category + overall scores.
- **TruckGradeSnapshotService** – Orchestrates snapshot recalculation: clears prior rows for the selected filters, chunks the fleet, calls `TruckGradeService`, and persists the results.
- **RecalculateTruckGradeSnapshots** job – Queued task that loops known filter combinations (snapshot date, vehicle type, status) and re-runs the snapshot service. When no historical filters exist it seeds the current date with no filters.

---

## 2. Data Flow

1. **Collect inputs**
   - Request filters choose a snapshot date plus optional vehicle type and status.
   - `TruckGradeSnapshotService::recalculateSnapshot()` resolves the date and selects matching trucks.
2. **Build metrics**
   - `TruckGradeService` loads aggregated performance, maintenance, and status data for the target truck + peer set.
   - Peer set defaults to trucks of the same vehicle type; it falls back to the wider fleet if the sample is too small.
3. **Apply scoring**
   - Category scores (utilization, efficiency, reliability, financial, compliance) map to configured weights.
   - Aggregate score converts to a letter using the grade thresholds (A ≥ threshold A, B ≥ threshold B, etc.). Grade E is hardcoded to 0.
4. **Persist snapshot**
   - Rows are inserted into `truck_grade_snapshots` in batches of 200 during a single transaction. Prior rows for the same filter combination are deleted first.
   - Each row records the JSON payload for weights, thresholds, categories, metrics, the operator who triggered the run, and the timestamp.
5. **Display results**
   - Reports fetch paginated snapshot rows and render KPI cards alongside filter controls.
   - Settings pages mirror the same dataset to preview changes after recalculation.

---

## 3. Working With Trucks

1. **Create or update trucks** using the fleet module (`resources/js/Pages/Trucks/*`). No special steps are required for grading; new trucks automatically participate in the next recalculation.
2. **Ensure supporting records exist** if you want richer scores:
   - Performance logs (`performances` via driver-truck assignments)
   - Maintenance records (`vehicle_maintenance_records`)
   - Daily status history (`daily_truck_statuses`)
3. **Run a recalculation** (see section 4) so the new data is captured in snapshots.
4. **Review the Truck Grading report** to confirm the truck appears with the expected grade and category metrics.

---

## 4. Recalculation Options

### 4.1 Immediate recalculation

- **Settings UI** – On `/settings/truck-grading` click **Recalculate snapshot** (available to operators with `trucks.update`).
- **Report UI** – On `/reports/truck-grading` use **Recalculate snapshot** to refresh the actively viewed filters without leaving the report.
- Both buttons post JSON to `POST /settings/truck-grading/recalculate`. The React client attaches `X-CSRF-TOKEN` (meta) and `X-XSRF-TOKEN` (cookie) headers.

### 4.2 Automatic refresh after settings changes

- Saving weights or grade thresholds queues `RecalculateTruckGradeSnapshots` with every distinct filter combination present in the snapshot table.
- Ensure a queue worker is running (`php artisan queue:work`) so the job can process in the background.

### 4.3 CLI & testing helpers

```bash
# Recalculate a single snapshot directly (bypasses the queue)
php artisan tinker --execute="app(App\\Services\\TruckGradeSnapshotService::class)->recalculateSnapshot(now()->toDateString())"

# Run feature tests that cover recalculation and reporting
php artisan test --filter=TruckGradingSnapshotTest
php artisan test --filter=TruckGradingReportTest
```

---

## 5. Frontend Surfaces

### 5.1 Truck Grading Report (`Reports/TruckGrading.tsx`)

- Displays KPI cards (snapshot date, tracked trucks, average score, top grade, last calculated, calculated by).
- Filter drawer controls snapshot date, vehicle type, truck status, grade band, and page size.
- Manual recalculation button sends an AJAX request and then reloads report props via Inertia.
- Table rows include grade badges, top category chips, service dates, purchase price, and snapshot metadata.

### 5.2 Truck Grading Settings (`settings/truck-grading.tsx`)

- Presents weight sliders (must sum to 100%), grade threshold inputs, and the peer sample size field.
- Uses Wayfinder-generated `<Form>` helpers to post `PATCH` requests to the settings controller.
- Successful submissions flash confirmation messages and queue recalculation as described above.

---

## 6. Controller Endpoints

| Route name | Method & path | Responsibility |
|------------|----------------|----------------|
| `reports.truck-grading` | `GET /reports/truck-grading` | Validates filters via `TruckGradingReportRequest`, renders report props from `TruckGradingReport` service. Requires `trucks.show`. |
| `settings.truck-grading.edit` | `GET /settings/truck-grading` | Loads settings form, recent snapshots, and filter options. Requires `trucks.update`. |
| `settings.truck-grading.update` | `PATCH /settings/truck-grading` | Stores combined weights + thresholds via `UpdateTruckGradingSettingsRequest`. |
| `settings.truck-grading.updateWeights` | `PATCH /settings/truck-grading/weights` | Saves weight-only changes (must total 100%). |
| `settings.truck-grading.updateGradeThresholds` | `PATCH /settings/truck-grading/grade-thresholds` | Persists threshold-only updates; enforces descending ranges with grade E = 0. |
| `settings.truck-grading.recalculate` | `POST /settings/truck-grading/recalculate` | Validates filters with `RecalculateTruckGradesRequest`, executes snapshot service, returns JSON or redirects with flash message. |

_All update routes require the `trucks.update` permission._

---

## 7. Testing & Validation

- `TruckGradingSnapshotTest` verifies that authorized users can recalculate snapshots, data is persisted, and the settings page renders populated rows.
- `TruckGradingReportTest` asserts permission checks, snapshot filtering, and Inertia props for the public report.
- When modifying grading logic, add targeted unit or feature tests (e.g., new metrics) and run the focused suite. Follow the testing rule: **write or update a test for every behavior change**.

Recommended workflow:

```bash
# Lint & format before pushing
vendor/bin/pint --dirty
npm run lint

# Build frontend bundles if UI changes were made
npm run build
```

---

## 8. Troubleshooting

- **Grades missing** – Ensure a snapshot exists for the selected date. Trigger a recalculation if necessary.
- **Permissions error** – Confirm the user has `trucks.show` (report) or `trucks.update` (settings/recalculate).
- **419 CSRF token mismatch** – Check that `<meta name="csrf-token">` is present in `resources/views/app.blade.php` and the browser has an `XSRF-TOKEN` cookie. Re-run `npm run build` if you recently updated the frontend token helper.
- **Queue jobs piling up** – Start a worker (`php artisan queue:work`) or switch to `sync` driver in `.env` for local debugging.
- **Inconsistent scores** – Remember scores are relative to peers. Verify that related data (performance, maintenance, status) exists for both the target truck and its peer sample.

---

## 9. Change Checklist

When altering truck grading logic:

1. Update `TruckGradeService` computations or weight handling.
2. Adjust snapshot serialization if new metrics are introduced.
3. Patch settings validation (weight sums, thresholds) as needed.
4. Regenerate Wayfinder clients if routes change: `php artisan wayfinder:generate`.
5. Update documentation (this file) with any new categories, thresholds, or UI elements.
6. Re-run focused tests and confirm `npm run build` completes without errors.

_Last updated: December 2025._
