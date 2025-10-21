# Technical Documentation - TIMS

This document provides comprehensive technical documentation for the Transport Information Management System (TIMS), covering architecture, implementation details, and technical specifications.

## 📋 Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Database Design](#3-database-design)
4. [API Architecture](#4-api-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Security Architecture](#6-security-architecture)
7. [Performance Architecture](#7-performance-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Monitoring and Logging](#9-monitoring-and-logging)
10. [Development Workflow](#10-development-workflow)
11. [Testing Strategy](#11-testing-strategy)
12. [Code Quality](#12-code-quality)
13. [Documentation Standards](#13-documentation-standards)

---

## 1. System Architecture

### 1.1 Overall Architecture

TIMS follows a modern web application architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   React     │  │  TypeScript │  │   Tailwind  │        │
│  │   Components│  │   Types     │  │     CSS     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              │ Inertia.js
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Laravel    │  │   PHP 8.2+ │  │   MySQL     │        │
│  │ Controllers │  │   Models   │  │  Database   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Eloquent ORM
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   MySQL     │  │   Indexes   │  │  Constraints│        │
│  │   Tables    │  │  & Foreign  │  │   & Triggers│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Architecture

The system is built using a component-based architecture:

#### Frontend Components
```
resources/js/
├── components/           # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── forms/          # Form-specific components
│   ├── tables/         # Table components
│   └── dialogs/        # Dialog components
├── pages/              # Page components (Inertia.js)
│   ├── Auth/           # Authentication pages
│   ├── Dashboard/      # Dashboard pages
│   └── Modules/        # Module-specific pages
├── layouts/            # Layout components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── types/              # TypeScript type definitions
```

#### Backend Components
```
app/
├── Http/
│   ├── Controllers/    # Request handlers
│   ├── Middleware/     # HTTP middleware
│   └── Requests/      # Form validation
├── Models/            # Eloquent models
├── Services/          # Business logic
├── Providers/         # Service providers
└── Exceptions/        # Custom exceptions
```

### 1.3 Data Flow Architecture

```
User Action → Frontend Component → Inertia.js → Laravel Controller → Model → Database
                ↓
            Response ← Inertia.js ← Laravel Controller ← Model ← Database
```

## 2. Technology Stack

### 2.1 Backend Technologies

#### Core Framework
- **Laravel 12**: Modern PHP framework with latest features
- **PHP 8.2+**: Latest PHP version with modern features
- **Composer**: PHP dependency management

#### Database
- **MySQL 8.0+**: Primary database (production)
- **SQLite**: Development database
- **Eloquent ORM**: Database abstraction layer

#### Authentication & Security
- **Laravel Fortify**: Authentication system
- **Spatie Laravel Permission**: Role and permission management
- **Spatie Laravel Activitylog**: Activity logging
- **Laravel Sanctum**: API token authentication

#### Additional Packages
- **Laravel Wayfinder**: Route generation
- **Inertia.js**: SPA bridge
- **Laravel Telescope**: Debug and monitoring (development)

### 2.2 Frontend Technologies

#### Core Framework
- **React 19**: Latest React with modern features
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and development server

#### UI Framework
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **Radix UI**: Accessible UI primitives
- **Lucide React**: Icon library

#### State Management
- **React Hooks**: Built-in state management
- **Inertia.js**: Server state management
- **Zustand**: Client state management (if needed)

#### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking

### 2.3 Development Tools

#### Version Control
- **Git**: Version control system
- **GitHub**: Code repository hosting

#### Testing
- **PHPUnit**: PHP testing framework
- **Jest**: JavaScript testing framework (future)
- **React Testing Library**: React component testing (future)

#### Build Tools
- **Vite**: Frontend build tool
- **Laravel Mix**: Asset compilation (legacy)
- **Webpack**: Module bundler (via Vite)

## 3. Database Design

### 3.1 Database Schema

The database follows a normalized design with proper relationships:

#### Core Tables
```sql
-- Users and Authentication
users (id, name, email, password, email_verified_at, created_at, updated_at)
personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at)

-- Spatie Permission Tables
roles (id, name, guard_name, created_at, updated_at)
permissions (id, name, guard_name, created_at, updated_at)
model_has_roles (role_id, model_type, model_id)
model_has_permissions (permission_id, model_type, model_id)
role_has_permissions (permission_id, role_id)

-- Activity Logging
activity_log (id, log_name, description, subject_type, subject_id, causer_type, causer_id, properties, batch_uuid, created_at, updated_at)
```

#### Fleet Management Tables
```sql
-- Vehicle Types
vehicle_types (id, name, description, created_at, updated_at, deleted_at)

-- Trucks
trucks (id, plate, vehicletype_id, chasisNumber, engineNumber, tyreSyze, serviceIntervalKM, purchasePrice, productionDate, serviceStartDate, status, created_at, updated_at, deleted_at)

-- Drivers
drivers (id, driverid, name, sex, birthdate, zone, woreda, kebele, housenumber, mobile, hireddate, status, created_at, updated_at, deleted_at)

-- Driver-Truck Assignments
driver_truck (id, driver_id, truck_id, assigned_date, released_date, status, created_at, updated_at)
```

#### Operations Tables
```sql
-- Customers
customers (id, name, contact_person, phone, email, address, created_at, updated_at, deleted_at)

-- Operations
operations (id, operation, customer_id, startdate, enddate, volume, km, tariff, closed, created_at, updated_at, deleted_at)

-- Cargo Types
cargo_types (id, name, description, handling_requirements, created_at, updated_at, deleted_at)

-- Performances
performances (id, trip, LoadType, FOnumber, operation_id, driver_truck_id, DateDispach, orgion_id, destination_id, user_id, DistanceWCargo, tonkm, DistanceWOCargo, CargoVolumMT, fuelInLitter, fuelInBirr, perdiem, workOnGoing, other, comment, satus, is_returned, cargo_type_id, created_at, updated_at)
```

### 3.2 Database Relationships

#### Primary Relationships
```php
// Truck relationships
Truck::belongsTo(VehicleType::class, 'vehicletype_id')
Truck::hasMany(VehicleMaintenanceRecord::class)
Truck::hasMany(FuelRecord::class)
Truck::hasMany(TruckFinancialRecord::class)
Truck::belongsToMany(Driver::class, 'driver_truck')

// Driver relationships
Driver::hasMany(DriverPerformanceRecord::class)
Driver::hasMany(DriverSafetyRecord::class)
Driver::belongsToMany(Truck::class, 'driver_truck')

// Performance relationships
Performance::belongsTo(Operation::class, 'operation_id')
Performance::belongsTo(DriverTruck::class, 'driver_truck_id')
Performance::belongsTo(Place::class, 'orgion_id')
Performance::belongsTo(Place::class, 'destination_id')
Performance::belongsTo(User::class, 'user_id')
Performance::belongsTo(CargoType::class, 'cargo_type_id')
```

### 3.3 Database Indexing Strategy

#### Primary Indexes
```sql
-- Foreign key indexes (automatic)
ALTER TABLE trucks ADD INDEX idx_trucks_vehicletype_id (vehicletype_id);
ALTER TABLE drivers ADD INDEX idx_drivers_driverid (driverid);
ALTER TABLE performances ADD INDEX idx_performances_operation_id (operation_id);

-- Search indexes
ALTER TABLE trucks ADD INDEX idx_trucks_plate (plate);
ALTER TABLE trucks ADD INDEX idx_trucks_chasisNumber (chasisNumber);
ALTER TABLE trucks ADD INDEX idx_trucks_engineNumber (engineNumber);
ALTER TABLE drivers ADD INDEX idx_drivers_name (name);
ALTER TABLE drivers ADD INDEX idx_drivers_mobile (mobile);

-- Status indexes
ALTER TABLE trucks ADD INDEX idx_trucks_status (status);
ALTER TABLE drivers ADD INDEX idx_drivers_status (status);
ALTER TABLE performances ADD INDEX idx_performances_satus (satus);

-- Date indexes
ALTER TABLE trucks ADD INDEX idx_trucks_created_at (created_at);
ALTER TABLE drivers ADD INDEX idx_drivers_hireddate (hireddate);
ALTER TABLE performances ADD INDEX idx_performances_DateDispach (DateDispach);
```

## 4. API Architecture

### 4.1 RESTful API Design

TIMS follows RESTful conventions for API endpoints:

#### Resource Endpoints
```http
# Trucks
GET    /trucks              # List trucks
POST   /trucks              # Create truck
GET    /trucks/{id}         # Show truck
PUT    /trucks/{id}         # Update truck
DELETE /trucks/{id}         # Delete truck
GET    /trucks/export       # Export trucks

# Drivers
GET    /drivers             # List drivers
POST   /drivers             # Create driver
GET    /drivers/{id}        # Show driver
PUT    /drivers/{id}        # Update driver
DELETE /drivers/{id}        # Delete driver
GET    /drivers/export      # Export drivers
```

### 4.2 Request/Response Format

#### Request Format
```json
{
  "data": {
    "plate": "AA1234BB",
    "vehicletype_id": "uuid",
    "chasisNumber": "CHASIS123456",
    "engineNumber": "ENGINE123456",
    "tyreSyze": "225/75R16",
    "serviceIntervalKM": 10000,
    "purchasePrice": 1500000,
    "productionDate": "2020-01-01",
    "serviceStartDate": "2020-02-01",
    "status": "active"
  }
}
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "plate": "AA1234BB",
    "vehicletype_id": "uuid",
    "chasisNumber": "CHASIS123456",
    "engineNumber": "ENGINE123456",
    "tyreSyze": "225/75R16",
    "serviceIntervalKM": 10000,
    "purchasePrice": 1500000,
    "productionDate": "2020-01-01",
    "serviceStartDate": "2020-02-01",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Truck created successfully"
}
```

### 4.3 Error Handling

#### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid",
    "details": {
      "plate": ["The plate field is required"],
      "chasisNumber": ["The chassis number field is required"]
    }
  }
}
```

#### HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

## 5. Frontend Architecture

### 5.1 Component Architecture

#### Component Hierarchy
```
AppLayout
├── AppHeader
├── AppSidebar
│   ├── NavigationMenu
│   └── UserMenu
└── AppContent
    ├── PageHeader
    ├── DataTable
    │   ├── TableHeader
    │   ├── TableBody
    │   └── TablePagination
    └── ActionButtons
```

#### Component Structure
```typescript
// Base Component Structure
interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

function BaseComponent({ className, children }: ComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  )
}
```

### 5.2 State Management

#### Local State
```typescript
// Component-level state
function TruckIndex() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('plate')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  
  // State management logic
}
```

#### Server State (Inertia.js)
```typescript
// Server state management
function TruckIndex({ trucks }: { trucks: PaginatedData<Truck> }) {
  // trucks data comes from server via Inertia.js
  // No need for client-side state management
}
```

#### Form State
```typescript
// Form state management
function TruckCreate() {
  const { data, setData, post, processing, errors } = useForm({
    plate: '',
    vehicletype_id: '',
    chasisNumber: '',
    engineNumber: '',
    tyreSyze: '',
    serviceIntervalKM: 0,
    purchasePrice: 0,
    productionDate: '',
    serviceStartDate: '',
    status: 'active'
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('trucks.store'))
  }
}
```

### 5.3 Routing Architecture

#### Route Structure
```typescript
// Route definitions (generated by Wayfinder)
declare global {
  interface RouteList {
    'trucks.index': { method: 'GET'; uri: '/trucks' }
    'trucks.create': { method: 'GET'; uri: '/trucks/create' }
    'trucks.store': { method: 'POST'; uri: '/trucks' }
    'trucks.show': { method: 'GET'; uri: '/trucks/{truck}' }
    'trucks.edit': { method: 'GET'; uri: '/trucks/{truck}/edit' }
    'trucks.update': { method: 'PUT'; uri: '/trucks/{truck}' }
    'trucks.destroy': { method: 'DELETE'; uri: '/trucks/{truck}' }
    'trucks.export': { method: 'GET'; uri: '/trucks/export' }
  }
}
```

#### Navigation
```typescript
// Programmatic navigation
import { router } from '@inertiajs/react'

function navigateToTruck(id: string) {
  router.visit(route('trucks.show', id))
}

// Link navigation
import { Link } from '@inertiajs/react'

function TruckLink({ truck }: { truck: Truck }) {
  return (
    <Link href={route('trucks.show', truck.id)}>
      {truck.plate}
    </Link>
  )
}
```

## 6. Security Architecture

### 6.1 Authentication System

#### Laravel Fortify Integration
```php
// Fortify configuration
Fortify::authenticateUsing(function (Request $request) {
    $user = User::where('email', $request->email)->first();
    
    if ($user && Hash::check($request->password, $user->password)) {
        return $user;
    }
});

// Two-factor authentication
Fortify::twoFactorAuthenticationView(function () {
    return view('auth.two-factor-challenge');
});
```

#### Session Management
```php
// Session configuration
'session' => [
    'driver' => env('SESSION_DRIVER', 'file'),
    'lifetime' => env('SESSION_LIFETIME', 120),
    'expire_on_close' => false,
    'encrypt' => false,
    'files' => storage_path('framework/sessions'),
    'connection' => env('SESSION_CONNECTION'),
    'table' => 'sessions',
    'store' => env('SESSION_STORE'),
    'lottery' => [2, 100],
    'cookie' => env('SESSION_COOKIE', 'laravel_session'),
    'path' => '/',
    'domain' => env('SESSION_DOMAIN'),
    'secure' => env('SESSION_SECURE_COOKIE'),
    'http_only' => true,
    'same_site' => 'lax',
],
```

### 6.2 Authorization System

#### Spatie Permission Integration
```php
// Permission middleware
Route::middleware(['permission:trucks.create'])->group(function () {
    Route::get('/trucks/create', [TruckController::class, 'create']);
    Route::post('/trucks', [TruckController::class, 'store']);
});

// Permission checking in controllers
public function store(StoreTruckRequest $request)
{
    if (!$request->user()->can('trucks.create')) {
        abort(403, 'Insufficient permissions');
    }
    
    // Create truck logic
}
```

#### Role-Based Access Control
```php
// Role assignment
$user = User::find(1);
$user->assignRole('admin');

// Permission assignment
$role = Role::findByName('admin');
$role->givePermissionTo('trucks.create');

// Permission checking
if ($user->can('trucks.create')) {
    // User can create trucks
}
```

### 6.3 Data Protection

#### Input Validation
```php
// Form request validation
class StoreTruckRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'plate' => 'required|string|max:255|unique:trucks,plate',
            'chasisNumber' => 'required|string|max:255|unique:trucks,chasisNumber',
            'engineNumber' => 'required|string|max:255|unique:trucks,engineNumber',
            'serviceIntervalKM' => 'required|integer|min:1000|max:100000',
            'purchasePrice' => 'required|numeric|min:0',
            'productionDate' => 'required|date|before:today',
            'serviceStartDate' => 'required|date|after_or_equal:productionDate',
            'status' => 'required|string|in:active,inactive,maintenance,retired'
        ];
    }
}
```

#### SQL Injection Prevention
```php
// Eloquent ORM (automatic protection)
$trucks = Truck::where('plate', $request->plate)->get();

// Query Builder (automatic protection)
$trucks = DB::table('trucks')
    ->where('plate', $request->plate)
    ->get();

// Raw queries (manual protection)
$trucks = DB::select('SELECT * FROM trucks WHERE plate = ?', [$request->plate]);
```

#### XSS Prevention
```php
// Automatic escaping in Blade templates
{{ $truck->plate }} // Automatically escaped

// Manual escaping
{!! $truck->plate !!} // Not escaped (use with caution)

// Frontend protection
function sanitizeInput(input: string): string {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}
```

## 7. Performance Architecture

### 7.1 Database Optimization

#### Query Optimization
```php
// Eager loading to prevent N+1 queries
$trucks = Truck::with(['vehicletype', 'maintenanceRecords'])
    ->paginate(15);

// Query optimization
$trucks = Truck::select(['id', 'plate', 'status', 'created_at'])
    ->where('status', 'active')
    ->orderBy('created_at', 'desc')
    ->paginate(15);

// Database indexes
Schema::table('trucks', function (Blueprint $table) {
    $table->index('plate');
    $table->index('status');
    $table->index('created_at');
});
```

#### Caching Strategy
```php
// Model caching
$trucks = Cache::remember('trucks.active', 3600, function () {
    return Truck::where('status', 'active')->get();
});

// Query result caching
$trucks = Truck::where('status', 'active')
    ->remember(3600)
    ->get();

// Configuration caching
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 7.2 Frontend Optimization

#### Code Splitting
```typescript
// Lazy loading components
const TruckCreate = lazy(() => import('./TruckCreate'))
const TruckEdit = lazy(() => import('./TruckEdit'))

// Route-based code splitting
const routes = [
  {
    path: '/trucks/create',
    component: lazy(() => import('./TruckCreate'))
  },
  {
    path: '/trucks/:id/edit',
    component: lazy(() => import('./TruckEdit'))
  }
]
```

#### Asset Optimization
```javascript
// Vite configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
})
```

#### Image Optimization
```typescript
// Image optimization
function OptimizedImage({ src, alt, ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  )
}
```

### 7.3 Server Optimization

#### PHP Optimization
```php
// OPcache configuration
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=2
opcache.fast_shutdown=1
```

#### Web Server Optimization
```nginx
# Nginx configuration
server {
    listen 80;
    server_name tims.local;
    root /var/www/tims/public;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Browser caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## 8. Deployment Architecture

### 8.1 Production Environment

#### Server Requirements
- **PHP**: 8.2 or higher
- **MySQL**: 8.0 or higher
- **Nginx**: 1.18 or higher
- **Node.js**: 20.19+ or 22.12+
- **Composer**: Latest stable version

#### Environment Configuration
```env
# Production environment
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tims.example.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tims_production
DB_USERNAME=tims_user
DB_PASSWORD=secure_password

# Cache
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=noreply@example.com
MAIL_PASSWORD=mail_password
MAIL_ENCRYPTION=tls
```

### 8.2 Deployment Process

#### Automated Deployment
```bash
#!/bin/bash
# deploy.sh

# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader
npm ci && npm run build

# Run migrations
php artisan migrate --force

# Clear and cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart services
sudo systemctl reload nginx
sudo systemctl restart php8.2-fpm
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application
COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader
RUN npm ci && npm run build

# Set permissions
RUN chown -R www-data:www-data /var/www
RUN chmod -R 755 /var/www

EXPOSE 9000
CMD ["php-fpm"]
```

### 8.3 CI/CD Pipeline

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
        
    - name: Install dependencies
      run: composer install --no-dev --optimize-autoloader
      
    - name: Run tests
      run: php artisan test
      
    - name: Build assets
      run: npm ci && npm run build
      
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/tims
          git pull origin main
          composer install --no-dev --optimize-autoloader
          npm ci && npm run build
          php artisan migrate --force
          php artisan config:cache
          php artisan route:cache
          php artisan view:cache
          sudo systemctl reload nginx
```

## 9. Monitoring and Logging

### 9.1 Application Monitoring

#### Laravel Telescope (Development)
```php
// Telescope configuration
'telescope' => [
    'enabled' => env('TELESCOPE_ENABLED', true),
    'domain' => env('TELESCOPE_DOMAIN'),
    'path' => env('TELESCOPE_PATH', 'telescope'),
    'driver' => env('TELESCOPE_DRIVER', 'database'),
    'storage' => [
        'database' => [
            'connection' => env('DB_CONNECTION', 'mysql'),
            'chunk' => 1000,
        ],
    ],
],
```

#### Performance Monitoring
```php
// Performance monitoring
use Illuminate\Support\Facades\DB;

DB::listen(function ($query) {
    if ($query->time > 1000) { // Log slow queries
        Log::warning('Slow query detected', [
            'sql' => $query->sql,
            'time' => $query->time,
            'bindings' => $query->bindings
        ]);
    }
});
```

### 9.2 Logging System

#### Application Logging
```php
// Logging configuration
'logging' => [
    'default' => env('LOG_CHANNEL', 'stack'),
    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => ['single', 'daily'],
            'ignore_exceptions' => false,
        ],
        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
        ],
        'daily' => [
            'driver' => 'daily',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 14,
        ],
    ],
],
```

#### Activity Logging
```php
// Activity logging
use Spatie\ActivityLog\Facades\Activity;

// Log creation
Activity::performedOn($truck)
    ->causedBy(auth()->user())
    ->log('created');

// Log update with changes
Activity::performedOn($truck)
    ->causedBy(auth()->user())
    ->withProperties([
        'old' => $oldData,
        'new' => $truck->toArray()
    ])
    ->log('updated');

// Log deletion
Activity::performedOn($truck)
    ->causedBy(auth()->user())
    ->withProperties(['deleted_data' => $truckData])
    ->log('deleted');
```

### 9.3 Error Tracking

#### Error Handling
```php
// Global error handler
public function register()
{
    $this->reportable(function (Throwable $e) {
        if ($this->shouldReport($e)) {
            Log::error('Application error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    });
}
```

#### Frontend Error Tracking
```typescript
// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }

    return this.props.children
  }
}
```

## 10. Development Workflow

### 10.1 Development Environment Setup

#### Local Development
```bash
# Clone repository
git clone https://github.com/your-org/tims.git
cd tims

# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate
php artisan db:seed

# Start development servers
php artisan serve
npm run dev
```

#### Development Tools
```json
// VS Code settings
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "php.suggest.basic": false,
  "php.validate.enable": true,
  "emmet.includeLanguages": {
    "blade": "html"
  }
}
```

### 10.2 Code Standards

#### PHP Standards
```php
// PSR-12 compliance
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Truck;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TruckController extends Controller
{
    public function index(Request $request): Response
    {
        $trucks = Truck::with(['vehicletype'])
            ->when($request->search, function ($query, $search) {
                $query->where('plate', 'like', "%{$search}%");
            })
            ->paginate(15);

        return Inertia::render('Trucks/Index', [
            'trucks' => $trucks,
        ]);
    }
}
```

#### TypeScript Standards
```typescript
// TypeScript standards
interface Truck {
  id: number
  plate: string
  vehicletype_id: number
  chasisNumber: string
  engineNumber: string
  tyreSyze: string
  serviceIntervalKM: number
  purchasePrice: number
  productionDate: string
  serviceStartDate: string
  status: 'active' | 'inactive' | 'maintenance' | 'retired'
  created_at: string
  updated_at: string
  deleted_at?: string
}

function TruckIndex({ trucks }: { trucks: PaginatedData<Truck> }): JSX.Element {
  return (
    <div className="space-y-4">
      {trucks.data.map((truck) => (
        <TruckCard key={truck.id} truck={truck} />
      ))}
    </div>
  )
}
```

### 10.3 Git Workflow

#### Branch Strategy
```bash
# Feature branch
git checkout -b feature/truck-management
git add .
git commit -m "feat: add truck management functionality"
git push origin feature/truck-management

# Pull request
# Create PR from feature/truck-management to main

# Merge after review
git checkout main
git pull origin main
git merge feature/truck-management
git push origin main
```

#### Commit Message Convention
```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 11. Testing Strategy

### 11.1 Testing Pyramid

#### Unit Tests
```php
// Unit test example
class TruckTest extends TestCase
{
    use RefreshDatabase;

    public function test_truck_can_be_created()
    {
        $truck = Truck::factory()->create([
            'plate' => 'AA1234BB',
            'status' => 'active'
        ]);

        $this->assertDatabaseHas('trucks', [
            'plate' => 'AA1234BB',
            'status' => 'active'
        ]);
    }

    public function test_truck_belongs_to_vehicle_type()
    {
        $vehicleType = VehicleType::factory()->create();
        $truck = Truck::factory()->create([
            'vehicletype_id' => $vehicleType->id
        ]);

        $this->assertInstanceOf(VehicleType::class, $truck->vehicletype);
        $this->assertEquals($vehicleType->id, $truck->vehicletype->id);
    }
}
```

#### Feature Tests
```php
// Feature test example
class TruckManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_trucks_index()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('Trucks/Index')
                    ->has('trucks.data', 1)
            );
    }

    public function test_user_can_create_truck()
    {
        $user = User::factory()->create();
        $vehicleType = VehicleType::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('trucks.store'), [
                'plate' => 'AA1234BB',
                'vehicletype_id' => $vehicleType->id,
                'chasisNumber' => 'CHASIS123456',
                'engineNumber' => 'ENGINE123456',
                'tyreSyze' => '225/75R16',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 1500000,
                'productionDate' => '2020-01-01',
                'serviceStartDate' => '2020-02-01',
                'status' => 'active'
            ]);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', [
            'plate' => 'AA1234BB'
        ]);
    }
}
```

#### Integration Tests
```php
// Integration test example
class TruckWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_truck_workflow()
    {
        $user = User::factory()->create();
        $vehicleType = VehicleType::factory()->create();

        // Create truck
        $response = $this->actingAs($user)
            ->post(route('trucks.store'), [
                'plate' => 'AA1234BB',
                'vehicletype_id' => $vehicleType->id,
                'chasisNumber' => 'CHASIS123456',
                'engineNumber' => 'ENGINE123456',
                'tyreSyze' => '225/75R16',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 1500000,
                'productionDate' => '2020-01-01',
                'serviceStartDate' => '2020-02-01',
                'status' => 'active'
            ]);

        $response->assertRedirect(route('trucks.index'));

        // View truck
        $truck = Truck::where('plate', 'AA1234BB')->first();
        $response = $this->actingAs($user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('Trucks/Show')
                    ->has('truck')
            );

        // Update truck
        $response = $this->actingAs($user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'AA1234BB',
                'vehicletype_id' => $vehicleType->id,
                'chasisNumber' => 'CHASIS123456',
                'engineNumber' => 'ENGINE123456',
                'tyreSyze' => '225/75R16',
                'serviceIntervalKM' => 15000,
                'purchasePrice' => 1500000,
                'productionDate' => '2020-01-01',
                'serviceStartDate' => '2020-02-01',
                'status' => 'active'
            ]);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', [
            'plate' => 'AA1234BB',
            'serviceIntervalKM' => 15000
        ]);

        // Delete truck
        $response = $this->actingAs($user)
            ->delete(route('trucks.destroy', $truck));

        $response->assertRedirect(route('trucks.index'));
        $this->assertSoftDeleted('trucks', [
            'plate' => 'AA1234BB'
        ]);
    }
}
```

### 11.2 Test Configuration

#### PHPUnit Configuration
```xml
<!-- phpunit.xml -->
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="./vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory suffix="Test.php">./tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory suffix="Test.php">./tests/Feature</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory suffix=".php">./app</directory>
        </include>
    </source>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="BCRYPT_ROUNDS" value="4"/>
        <env name="CACHE_DRIVER" value="array"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
        <env name="MAIL_MAILER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="SESSION_DRIVER" value="array"/>
        <env name="TELESCOPE_ENABLED" value="false"/>
    </php>
</phpunit>
```

#### Test Database Setup
```php
// TestCase base class
abstract class TestCase extends BaseTestCase
{
    use CreatesApplication, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Run migrations
        $this->artisan('migrate');
        
        // Seed test data
        $this->artisan('db:seed', ['--class' => 'TestSeeder']);
    }
}
```

## 12. Code Quality

### 12.1 Code Analysis

#### PHP Code Analysis
```bash
# PHPStan
composer require --dev phpstan/phpstan
./vendor/bin/phpstan analyse app --level=8

# PHP CS Fixer
composer require --dev friendsofphp/php-cs-fixer
./vendor/bin/php-cs-fixer fix app --rules=@PSR12

# PHP Insights
composer require --dev nunomaduro/phpinsights
./vendor/bin/phpinsights analyse app
```

#### TypeScript Code Analysis
```bash
# ESLint
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npx eslint resources/js --ext .ts,.tsx

# Prettier
npm install --save-dev prettier
npx prettier --write resources/js

# TypeScript compiler
npx tsc --noEmit
```

### 12.2 Code Coverage

#### PHP Coverage
```bash
# Generate coverage report
./vendor/bin/phpunit --coverage-html coverage

# Coverage threshold
./vendor/bin/phpunit --coverage-clover coverage.xml
```

#### Frontend Coverage
```bash
# Jest coverage
npm test -- --coverage

# Coverage threshold
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

### 12.3 Performance Testing

#### Load Testing
```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:8000/trucks

# Artillery
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:8000/trucks
```

#### Database Performance
```sql
-- Query analysis
EXPLAIN SELECT * FROM trucks WHERE status = 'active';

-- Index usage
SHOW INDEX FROM trucks;

-- Slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

## 13. Documentation Standards

### 13.1 Code Documentation

#### PHP Documentation
```php
/**
 * Truck model representing a fleet vehicle.
 *
 * @property int $id
 * @property string $plate
 * @property int $vehicletype_id
 * @property string $chasisNumber
 * @property string $engineNumber
 * @property string $tyreSyze
 * @property int $serviceIntervalKM
 * @property float $purchasePrice
 * @property \Carbon\Carbon $productionDate
 * @property \Carbon\Carbon $serviceStartDate
 * @property string $status
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 *
 * @property-read \App\Models\VehicleType $vehicletype
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\VehicleMaintenanceRecord[] $maintenanceRecords
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\FuelRecord[] $fuelRecords
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\TruckFinancialRecord[] $financialRecords
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\Driver[] $drivers
 *
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck query()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck wherePlate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereVehicletypeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereChasisNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereEngineNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereTyreSyze($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereServiceIntervalKM($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck wherePurchasePrice($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereProductionDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereServiceStartDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Models\Truck whereDeletedAt($value)
 */
class Truck extends Model
{
    // Implementation
}
```

#### TypeScript Documentation
```typescript
/**
 * Truck interface representing a fleet vehicle.
 *
 * @interface Truck
 * @property {number} id - Unique identifier
 * @property {string} plate - License plate number
 * @property {number} vehicletype_id - Vehicle type identifier
 * @property {string} chasisNumber - Chassis number
 * @property {string} engineNumber - Engine number
 * @property {string} tyreSyze - Tyre size specification
 * @property {number} serviceIntervalKM - Service interval in kilometers
 * @property {number} purchasePrice - Purchase price in ETB
 * @property {string} productionDate - Production date (ISO string)
 * @property {string} serviceStartDate - Service start date (ISO string)
 * @property {'active' | 'inactive' | 'maintenance' | 'retired'} status - Truck status
 * @property {string} created_at - Creation timestamp (ISO string)
 * @property {string} updated_at - Last update timestamp (ISO string)
 * @property {string} [deleted_at] - Soft delete timestamp (ISO string)
 */
interface Truck {
  id: number
  plate: string
  vehicletype_id: number
  chasisNumber: string
  engineNumber: string
  tyreSyze: string
  serviceIntervalKM: number
  purchasePrice: number
  productionDate: string
  serviceStartDate: string
  status: 'active' | 'inactive' | 'maintenance' | 'retired'
  created_at: string
  updated_at: string
  deleted_at?: string
}

/**
 * Truck index page component.
 *
 * @component
 * @param {Object} props - Component props
 * @param {PaginatedData<Truck>} props.trucks - Paginated trucks data
 * @param {string} [props.search] - Current search query
 * @param {string} [props.sort] - Current sort field
 * @param {'asc' | 'desc'} [props.direction] - Sort direction
 * @returns {JSX.Element} Rendered component
 */
function TruckIndex({ trucks, search, sort, direction }: TruckIndexProps): JSX.Element {
  // Implementation
}
```

### 13.2 API Documentation

#### OpenAPI Specification
```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: TIMS API
  description: Transport Information Management System API
  version: 1.0.0
  contact:
    name: API Support
    email: support@tims.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.tims.com/v1
    description: Production server
  - url: https://staging-api.tims.com/v1
    description: Staging server

paths:
  /trucks:
    get:
      summary: List trucks
      description: Retrieve a paginated list of trucks
      parameters:
        - name: search
          in: query
          description: Search query
          required: false
          schema:
            type: string
        - name: sort
          in: query
          description: Sort field
          required: false
          schema:
            type: string
            enum: [plate, chasisNumber, engineNumber, status, created_at]
        - name: direction
          in: query
          description: Sort direction
          required: false
          schema:
            type: string
            enum: [asc, desc]
        - name: page
          in: query
          description: Page number
          required: false
          schema:
            type: integer
            minimum: 1
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Truck'
                  links:
                    $ref: '#/components/schemas/PaginationLinks'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'

components:
  schemas:
    Truck:
      type: object
      properties:
        id:
          type: integer
          description: Unique identifier
        plate:
          type: string
          description: License plate number
          pattern: '^[A-Z]{2}[0-9]{4}[A-Z]{2}$'
        vehicletype_id:
          type: integer
          description: Vehicle type identifier
        chasisNumber:
          type: string
          description: Chassis number
        engineNumber:
          type: string
          description: Engine number
        tyreSyze:
          type: string
          description: Tyre size specification
        serviceIntervalKM:
          type: integer
          description: Service interval in kilometers
          minimum: 1000
          maximum: 100000
        purchasePrice:
          type: number
          description: Purchase price in ETB
          minimum: 0
        productionDate:
          type: string
          format: date
          description: Production date
        serviceStartDate:
          type: string
          format: date
          description: Service start date
        status:
          type: string
          enum: [active, inactive, maintenance, retired]
          description: Truck status
        created_at:
          type: string
          format: date-time
          description: Creation timestamp
        updated_at:
          type: string
          format: date-time
          description: Last update timestamp
        deleted_at:
          type: string
          format: date-time
          nullable: true
          description: Soft delete timestamp
      required:
        - id
        - plate
        - vehicletype_id
        - chasisNumber
        - engineNumber
        - tyreSyze
        - serviceIntervalKM
        - purchasePrice
        - productionDate
        - serviceStartDate
        - status
        - created_at
        - updated_at
```

### 13.3 User Documentation

#### User Manual Structure
```markdown
# User Manual

## Table of Contents
1. Getting Started
2. Dashboard Overview
3. Fleet Management
4. Driver Management
5. Performance Tracking
6. Financial Management
7. Maintenance Management
8. Reporting
9. User Management
10. Troubleshooting

## 1. Getting Started

### 1.1 System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Screen resolution: 1024x768 or higher

### 1.2 Login Process
1. Navigate to the TIMS login page
2. Enter your email address
3. Enter your password
4. Click "Login"
5. Complete two-factor authentication if enabled

### 1.3 Navigation
- Use the sidebar menu to navigate between modules
- Click on module names to expand sub-menus
- Use the breadcrumb navigation to track your location
- Use the search bar to find specific records

## 2. Dashboard Overview

### 2.1 Key Metrics
The dashboard displays key performance indicators:
- Total trucks in fleet
- Active trucks
- Total drivers
- Active drivers
- Total operations
- Active operations
- Total performances
- Completed performances

### 2.2 Performance Status
- Fleet utilization percentage
- Driver performance scores
- Maintenance status overview
- Financial performance summary

### 2.3 Recent Activity
- Latest truck registrations
- Recent driver assignments
- Performance records
- Maintenance activities
- Financial transactions
```

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Status**: Production Ready  
**Maintainer**: Development Team
