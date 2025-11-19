# Truck Module Guide

This guide explains the truck management feature for both developers and operators. Skim **Quick Facts** to get oriented or jump to the section that matches your role.

---

## Quick Facts

- Backend entry point: `app/Http/Controllers/TruckController.php`
- Key UI pages: `resources/js/Pages/Trucks/*`
- Admin demo account: `admin@test.com` / `password123`
- Feature test command: `php artisan test --filter=TruckControllerTest`
- Playwright command: `npm run test:e2e -- tests/e2e/truck-create.spec.ts`

---

## Part 1 - Developer Guide

### 1.1 Start Here

- Migrate and seed first: `php artisan migrate --seed`
- Playwright prerequisites:
  - Install bundled browsers once per machine: `npx playwright install`
  - Confirm `.env` uses `QUEUE_CONNECTION=database` and `CACHE_STORE=database` so background jobs and cache-backed features behave the same as CI
- Confirm truck permissions exist (`trucks.view`, `trucks.create`, `trucks.store`, `trucks.show`, `trucks.edit`, `trucks.update`, `trucks.destroy`, `trucks.deactivate`, `trucks.export`, `trucks.free`)
- Regenerate Wayfinder clients after route changes: `php artisan wayfinder:generate`

### 1.2 Domain Essentials

- **Model**: `app/Models/Truck.php`
  - Soft deletes and Spatie activity logging
  - Relationships for vehicle type, drivers, maintenance, performances, fuel, finance, insurance, route plans, daily statuses
- **Form requests**: `StoreTruckRequest`, `UpdateTruckRequest`
  - Force uppercase plates with Ethiopian regex (`^[A-Z]{2,3}-[0-9]{4,5}$`)
  - Validate status (`active`, `inactive`, `maintenance`), numeric ranges (service interval 1k-100k KM, purchase price ≤ 999,999,999.99), date order (service start ≥ production)
- **Controller**: `TruckController`
  - Index metrics, CSV export, CRUD, deactivate, free-truck JSON, status history timeline using Inertia responses
- **Service**: `TruckAssignmentService`
  - Provides `getAvailableTrucks()` for the free-truck endpoint

### 1.3 Frontend Entry Points (Inertia + React 19)

- `Trucks/Index.tsx`: search, filters, metrics banner, pagination, CSV export, delete dialog
- `Trucks/Create.tsx`: Inertia `useForm`, live validation (`@/lib/validation`), unsaved changes indicator, scroll-to-top helper
- `Trucks/Edit.tsx`: pre-fills form data, mirrors Create layout
- `Trucks/Show.tsx`: tabs (Overview, Maintenance, Performance, History), quick actions, activity log table, delete dialog
- `Status/StatusHistory.tsx`: paginated daily status timeline with from/to filters

Restart `npm run dev` or run `npm run build` if UI updates do not appear immediately.

### 1.4 Validation & Rules

- Plates must follow `AA-1234` / `ABC-12345`; auto uppercased
- `vehicletype_id` must exist in `vehicletypes`
- `serviceStartDate` can never precede `productionDate`
- Delete action aborts if maintenance, performance, fuel, finance, insurance, route plan, daily status, or active driver assignments exist
- Deactivate endpoint only changes status to `inactive`
- CSV export mirrors index filters and logs an activity entry when a user downloads

### 1.5 Tests & Commands

```bash
# Feature coverage centred on TruckController
php artisan test --filter=TruckControllerTest

# Playwright scenario covering create + show flow
npm run test:e2e -- tests/e2e/truck-create.spec.ts
```

- Feature test covers index/search/sort/pagination, CRUD, status history, free truck JSON, CSV export, permissions, validation, deactivate, and activity logging
- Playwright spec logs in, creates a truck, confirms the index row, and verifies show-page fields (status, vehicle type, chassis, engine, tyre size, service interval, purchase price, production date, service start date)

### 1.6 Developer Tips

- Factory: `database/factories/TruckFactory.php` creates trucks with vehicle types; adjust seeders if you do not want the `retired` status
- Formatting: `vendor/bin/pint --dirty` for PHP, `npm run lint` and `npm run format` for TS/JS
- Debugging soft deletes: use `Truck::withTrashed()` in tinker when checking deleted rows
- Activity volume: truck show page pulls the latest 50 activity records; consider log noise when adding new events

---

## Part 2 - Operator Guide

### 2.1 Access Checklist

1. Open `/login` and authenticate (demo: `admin@test.com` / `password123`)
2. Ensure your role grants the required truck permissions; a 403 means you need at least `trucks.view`

### 2.2 Dashboard Tour

- Navigate to **Fleet → Trucks**
- Review the metrics banner (fleet total, active count, maintenance count, fleet value)
- Use **Search trucks…** for plates, chassis numbers, engine numbers, vehicle types
- Apply **Status** and **Vehicle Type** filters, adjust **Per Page** (15/25/50/100), and sort via table headers
- Action buttons: **Create Truck**, **Export CSV**, **Delete** (only when no linked records remain)

### 2.3 Create a Truck

1. Click **Create Truck**
2. Complete required fields: Plate Number (auto uppercased), Vehicle Type, Status
3. Optionally add chassis, engine, tyre size, service interval KM, purchase price, production date, service start date
4. Click **Create Truck**; fix any highlighted validation errors; success returns to the index with a confirmation toast

### 2.4 View & Edit Details

- Select a plate to open the detail view
- **Overview** tab: status badge, vehicle type, identifiers, financial card, quick actions (schedule maintenance, view performance, generate reports, edit)
- **Maintenance** tab: recent maintenance records with totals and status chips
- **Performance** tab: distance, fuel, cost summaries plus recent performance entries
- **History** tab: audit log of changes
- Use **Edit Truck** to update fields; saving returns to the index

### 2.5 Track Status History

- In the detail view choose **History → Status History** or visit `/trucks/{id}/status-history`
- Filter by From/To to see when statuses changed and who recorded them

### 2.6 Export & Free Trucks

- **Export CSV** downloads the filtered list with identifiers, financials, and statuses
- **Free Trucks** endpoint (`/trucks/free/list`) lists active trucks without driver assignments for planning

### 2.7 Deactivate or Delete

- **Deactivate** only sets the truck status to inactive; history stays intact
- **Delete** succeeds only if there are no maintenance, performance, fuel, finance, insurance, route plan, daily status, or active driver assignment records; the dialog explains any blockers

### 2.8 Troubleshooting

- Deletion blocked → clear dependent records first
- CSV export fails → verify `trucks.export` permission and retry after refreshing filters
- Plate rejected → ensure it matches `AA-1234` or `ABC-12345`
- Date error → production cannot be in the future; service start must be on/after production
- Playwright test fails → rerun migrations/seeders and confirm demo admin credentials exist

---

## Reference

- Backend contact: `TruckController`
- Frontend directory: `resources/js/Pages/Trucks`
- Core tests: `php artisan test --filter=TruckControllerTest`, `npm run test:e2e -- tests/e2e/truck-create.spec.ts`
- Demo account: `admin@test.com` / `password123`
- Last updated: November 2025
