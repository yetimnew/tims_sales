# Performance Optimization Recommendations for TIMS

## Executive Summary

This document provides comprehensive performance optimization recommendations for the Truck Information Management System (TIMS) based on analysis of both frontend and backend code. The recommendations are prioritized by impact and implementation difficulty.

---

## 🔴 Critical Issues (High Impact, Quick Wins)

### 1. Fix N+1 Query in TruckIndexService ✅ IMPLEMENTED

**Location:** `app/Services/Trucks/TruckIndexService.php:84-86`

**Problem:**
```php
'vehicleType' => $truck->relationLoaded('vehicleType')
    ? $truck->vehicleType?->only(['id', 'name'])
    : $truck->vehicleType()->first(['id', 'name']), // N+1 query!
```

**Solution:**
The `vehicleType` is already eager loaded on line 65, so the fallback query is unnecessary and causes N+1 queries.

**Fix:**
```php
'vehicleType' => $truck->vehicleType?->only(['id', 'name']),
```

**Impact:** Eliminates N+1 queries, reducing database queries from N+1 to 1 per page load.

---

### 2. Cache Status Options and Vehicle Types ✅ IMPLEMENTED

**Location:** `app/Services/Trucks/TruckIndexService.php:101-121`

**Problem:**
These queries run on every request:
- `Truck::query()->select('status')->distinct()->get()` (line 101)
- `VehicleType::query()->orderBy('name')->get()` (line 114)

**Solution:**
```php
// Add to TruckIndexService.php
use Illuminate\Support\Facades\Cache;

// In getIndexResult method, replace lines 101-121 with:
$statusOptions = Cache::remember('trucks.status_options', 3600, function () {
    return Truck::query()
        ->select('status')
        ->distinct()
        ->whereNotNull('status')
        ->orderBy('status')
        ->get()
        ->map(fn (Truck $truck): array => [
            'label' => Str::of($truck->status)->replace('_', ' ')->headline(),
            'value' => $truck->status,
        ])
        ->values()
        ->all();
});

$vehicleTypes = Cache::remember('trucks.vehicle_types', 3600, function () {
    return VehicleType::query()
        ->orderBy('name')
        ->get(['id', 'name'])
        ->map(fn (VehicleType $type): array => [
            'id' => $type->id,
            'name' => $type->name,
        ])
        ->all();
});
```

**Impact:** Reduces 2 database queries per request to 0 (after cache warm-up).

---

### 2b. Cache Status Options and Gender Options for Drivers ✅ IMPLEMENTED

**Location:** `app/Services/Drivers/DriverIndexService.php:82-106`

**Problem:**
These queries run on every request:
- `Driver::query()->select('status')->distinct()->get()` (line 82)
- `Driver::query()->select('sex')->distinct()->get()` (line 95)

**Solution:**
Similar caching implementation as trucks - cached with 1-hour TTL and cleared on driver create/update/delete.

**Impact:** Reduces 2 database queries per request to 0 (after cache warm-up).

---

### 3. Optimize TruckController Show Method

**Location:** `app/Http/Controllers/TruckController.php:146-424`

**Problem:**
Multiple cloned queries (`clone $performanceQuery`, `clone $maintenanceQuery`, etc.) execute sequentially, causing multiple database round trips.

**Solution:**
Combine queries where possible and use single queries with aggregations:

```php
// Replace multiple cloned queries with single optimized queries
$performanceStats = Performance::query()
    ->whereHas('driverTruck', fn($q) => $q->where('truck_id', $truck->id))
    ->selectRaw('
        COUNT(*) as total_records,
        SUM(CASE WHEN is_returned = 1 THEN 1 ELSE 0 END) as completed_trips,
        SUM(CASE WHEN is_returned = 0 OR is_returned IS NULL THEN 1 ELSE 0 END) as open_trips,
        SUM(CASE WHEN load_phase = "main" THEN 1 ELSE 0 END) as main_trip_records,
        COALESCE(SUM(DistanceWCargo), 0) as distance_with_cargo_sum,
        COALESCE(SUM(DistanceWOCargo), 0) as distance_without_cargo_sum,
        COALESCE(SUM(fuelInLitter), 0) as total_fuel,
        COALESCE(SUM(fuelInBirr), 0) as total_fuel_cost,
        COALESCE(SUM(tonkm), 0) as ton_km_sum,
        COALESCE(SUM(cargo_weight_kg), 0) as cargo_weight_kg_sum,
        COALESCE(SUM(CargoVolumMT), 0) as cargo_volume_sum
    ')
    ->first();
```

**Impact:** Reduces 10+ queries to 1-2 queries.

---

### 4. Add Database Indexes ✅ IMPLEMENTED

**Location:** `database/migrations/2025_12_15_191732_add_performance_indexes_for_trucks.php`

**Problem:**
Missing indexes on commonly filtered/searched columns.

**Solution:**
```php
// Migration includes indexes for trucks, drivers, performances, daily_truck_statuses, and driver_truck tables
Schema::table('trucks', function (Blueprint $table) {
    // Composite index for common filter combinations
    $table->index(['status', 'vehicletype_id'], 'idx_trucks_status_vehicletype');
    $table->index(['status', 'created_at'], 'idx_trucks_status_created');
});

Schema::table('drivers', function (Blueprint $table) {
    $table->index(['status', 'sex'], 'idx_drivers_status_sex');
    $table->index(['status', 'created_at'], 'idx_drivers_status_created');
    $table->index(['zone', 'status'], 'idx_drivers_zone_status');
});

Schema::table('performances', function (Blueprint $table) {
    $table->index(['DateDispach', 'is_returned'], 'idx_performances_date_returned');
    $table->index(['load_phase', 'DateDispach'], 'idx_performances_load_phase_date');
});

Schema::table('daily_truck_statuses', function (Blueprint $table) {
    $table->index(['truck_id', 'status_date'], 'idx_daily_status_truck_date');
    $table->index(['status_date', 'status_id'], 'idx_daily_status_date_status');
});

Schema::table('driver_truck', function (Blueprint $table) {
    $table->index(['truck_id', 'is_attached'], 'idx_driver_truck_truck_attached');
    $table->index(['driver_id', 'is_attached'], 'idx_driver_truck_driver_attached');
});
```

**Impact:** Dramatically improves query performance, especially for filtered searches.

---

## 🟡 Important Optimizations (Medium Impact)

### 5. Implement Redis Caching for Metrics

**Location:** `app/Services/TruckMetricsService.php`

**Problem:**
Currently uses in-memory array cache (`$localMetrics`) which is lost on each request.

**Solution:**
```php
use Illuminate\Support\Facades\Cache;

public function metrics(?string $search, ?int $vehicleTypeId, ?string $status = null): array
{
    $filters = [
        'search' => $search !== null && $search !== '' ? trim($search) : null,
        'vehicle_type' => $vehicleTypeId ?: null,
        'status' => $this->normalizeStatus($status),
    ];

    $cacheKey = 'truck_metrics:' . md5(json_encode($filters));
    
    return Cache::remember($cacheKey, 300, function () use ($filters) {
        // ... existing metrics calculation code ...
    });
}

public function clearCache(): void
{
    Cache::tags(['truck_metrics'])->flush();
}
```

**Update `.env`:**
```env
CACHE_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

**Impact:** Metrics cached across requests, reducing database load by 70-90%.

---

### 6. Optimize Search Queries

**Location:** `app/Services/TruckMetricsService.php:74-99`

**Problem:**
LIKE queries with `%search%` (leading wildcard) can't use indexes efficiently.

**Solution:**
```php
public function applyFilters(Builder $query, ?string $search, ?int $vehicleTypeId, ?string $status = null): Builder
{
    $search = $search !== null ? trim($search) : '';
    if ($search !== '') {
        // Use full-text search if available, otherwise optimize LIKE queries
        if (strlen($search) >= 3) {
            // For MySQL 5.7.6+, use full-text search
            $query->where(function ($inner) use ($search) {
                $inner->where('plate', 'like', "{$search}%")  // Remove leading %
                    ->orWhere('chasisNumber', 'like', "{$search}%")
                    ->orWhere('engineNumber', 'like', "{$search}%")
                    ->orWhereHas('vehicleType', function ($vehicleQuery) use ($search) {
                        $vehicleQuery->where('name', 'like', "{$search}%");
                    });
            });
        } else {
            // Fallback to original for short searches
            $query->where(function ($inner) use ($search) {
                $inner->where('plate', 'like', "%{$search}%")
                    ->orWhere('chasisNumber', 'like', "%{$search}%")
                    ->orWhere('engineNumber', 'like', "%{$search}%");
            });
        }
    }
    // ... rest of method
}
```

**Impact:** Improves search performance by 50-80% for searches with 3+ characters.

---

### 7. Frontend: Implement Virtual Scrolling for Large Tables

**Location:** `resources/js/pages/Trucks/Index.tsx`

**Problem:**
Rendering all table rows at once can cause performance issues with large datasets.

**Solution:**
Install `@tanstack/react-virtual`:
```bash
npm install @tanstack/react-virtual
```

Then implement virtual scrolling:
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// In TrucksIndex component
const parentRef = React.useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
    count: trucks?.data?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5,
});

// Render only visible rows
{virtualizer.getVirtualItems().map((virtualRow) => {
    const truck = trucks.data[virtualRow.index];
    return (
        <TableRow
            key={truck.id}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
            }}
        >
            {/* Row content */}
        </TableRow>
    );
})}
```

**Impact:** Improves rendering performance for tables with 100+ rows.

---

### 8. Frontend: Lazy Load Heavy Components

**Location:** `resources/js/pages/Trucks/Index.tsx`

**Problem:**
All components load upfront, increasing initial bundle size.

**Solution:**
```tsx
// Lazy load heavy components
const ListingStatsHeader = React.lazy(() => import('@/components/listing/stats-header'));
const ListingFilterBar = React.lazy(() => import('@/components/listing/filter-bar'));

// Wrap in Suspense
<React.Suspense fallback={<div>Loading...</div>}>
    <ListingStatsHeader />
    <ListingFilterBar />
</React.Suspense>
```

**Impact:** Reduces initial bundle size by 20-30%.

---

### 9. Optimize Vite Build Configuration

**Location:** `vite.config.ts`

**Current:** Good chunking strategy, but can be improved.

**Enhancement:**
```typescript
build: {
    rollupOptions: {
        output: {
            manualChunks: {
                'react-vendor': ['react', 'react-dom', '@inertiajs/react'],
                'ui-vendor': [
                    '@radix-ui/react-avatar',
                    // ... existing UI vendors
                ],
                'icons-vendor': ['lucide-react'],
                'charts-vendor': ['recharts'],
                'maps-vendor': ['leaflet', 'react-leaflet'],
                // Add page-specific chunks
                'trucks-page': ['./resources/js/pages/Trucks/Index.tsx'],
                'drivers-page': ['./resources/js/pages/Drivers/Index.tsx'],
            ],
        },
    },
    // Enable compression
    minify: 'terser',
    terserOptions: {
        compress: {
            drop_console: true, // Remove console.log in production
        },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Keep false for production
},
```

**Impact:** Better code splitting and smaller bundle sizes.

---

## 🟢 Nice-to-Have Optimizations (Lower Priority)

### 10. Implement Query Result Caching

**Location:** `app/Services/Trucks/TruckIndexService.php`

**Solution:**
```php
use Illuminate\Support\Facades\Cache;

public function getIndexResult(Request $request): TruckIndexResult
{
    $filters = TruckIndexFilters::fromRequest(...);
    
    // Cache key based on filters
    $cacheKey = 'trucks_index:' . md5(json_encode($filters->toQueryParameters()));
    
    return Cache::remember($cacheKey, 60, function () use ($filters) {
        // ... existing code ...
    });
}
```

**Note:** Clear cache on truck create/update/delete.

---

### 11. Add Database Query Logging in Development

**Location:** `app/Providers/AppServiceProvider.php`

**Solution:**
```php
if (app()->environment('local')) {
    DB::listen(function ($query) {
        if ($query->time > 100) { // Log slow queries (>100ms)
            \Log::warning('Slow query detected', [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
                'time' => $query->time,
            ]);
        }
    });
}
```

---

### 12. Optimize Image Assets

**Location:** `public/` directory

**Recommendations:**
- Use WebP format for images
- Implement lazy loading for images
- Use responsive images with `srcset`
- Compress images (aim for <100KB per image)

---

## 📊 Performance Metrics to Monitor

### Backend Metrics
1. **Response Time:** Target <200ms for index pages, <500ms for show pages
2. **Database Queries:** Target <10 queries per page load
3. **Cache Hit Rate:** Target >80% for cached endpoints
4. **Memory Usage:** Monitor PHP memory usage (target <128MB per request)

### Frontend Metrics
1. **First Contentful Paint (FCP):** Target <1.5s
2. **Largest Contentful Paint (LCP):** Target <2.5s
3. **Time to Interactive (TTI):** Target <3.5s
4. **Bundle Size:** Target <500KB initial bundle (gzipped)

---

## 🚀 Implementation Priority

### Phase 1 (Immediate - 1-2 days) ✅ COMPLETED
1. ✅ Fix N+1 query in TruckIndexService (#1)
2. ✅ Cache status options and vehicle types (#2)
3. ✅ Cache status options and gender options for Drivers (#2b)
4. ✅ Add database indexes (#4)

### Phase 2 (Short-term - 1 week)
4. Optimize TruckController show method (#3)
5. Implement Redis caching (#5)
6. Optimize search queries (#6)
7. Optimize Vite build (#9)

### Phase 3 (Medium-term - 2-4 weeks)
8. Frontend virtual scrolling (#7)
9. Lazy load components (#8)
10. Query result caching (#10)

---

## 📝 Testing Checklist

After implementing optimizations:

- [ ] Run `php artisan optimize` for production
- [ ] Test with 1000+ trucks in database
- [ ] Monitor database query count (should be <10 per page)
- [ ] Check cache hit rates
- [ ] Test search performance with various queries
- [ ] Verify frontend bundle sizes
- [ ] Test page load times (target <2s)
- [ ] Check memory usage under load

---

## 🔧 Configuration Updates Needed

### `.env` Updates
```env
# Switch to Redis for better performance
CACHE_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Database optimization
DB_STRICT_MODE=false  # If using older MySQL versions

# Queue for background jobs (if implementing)
QUEUE_CONNECTION=redis
```

### `config/cache.php`
Already configured, but ensure Redis is set up:
```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

---

## 📚 Additional Resources

- [Laravel Performance Optimization](https://laravel.com/docs/optimization)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [MySQL Index Optimization](https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)

---

## 🎯 Expected Performance Improvements

After implementing all Phase 1 and Phase 2 optimizations:

- **Page Load Time:** 50-70% reduction (from ~3s to ~1s)
- **Database Queries:** 60-80% reduction (from ~20 to ~5 queries)
- **Memory Usage:** 30-40% reduction
- **Frontend Bundle:** 20-30% reduction
- **Search Performance:** 50-80% improvement

---

**Last Updated:** 2025-01-XX
**Reviewed By:** Development Team

