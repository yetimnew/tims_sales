# Driver Grading Guide (Draft)

This document outlines the driver grading feature modeled on truck grading. It summarizes domain pieces, recalculation flow, reporting, and settings.

## Core Components
- `App\Models\DriverGradingSetting`: weights, thresholds, peer sample.
- `App\Services\DriverGradeService`: computes category and overall driver scores.
- `App\Models\DriverGradeSnapshot`: persisted snapshot rows per driver.
- `App\Services\DriverGradeSnapshotService`: batch-delete/insert snapshot data.
- `App\Jobs\RecalculateDriverGradeSnapshots`: queued recomputation across filter sets.
- `App\Services\Reports\DriverGradingReport`: report props for Inertia.

## Routes
- Settings: `GET /settings/driver-grading` and `POST /settings/driver-grading/recalculate`.
- Report (planned): `GET /reports/driver-grading`.

## Permissions
- View report: `drivers.show`.
- Update settings & recalc: `drivers.update`.

## Next Steps
- Implement Inertia pages for report and settings.
- Add feature tests mirroring truck grading coverage.
- Run `php artisan wayfinder:generate` after adding controller actions.

Last updated: December 2025.
