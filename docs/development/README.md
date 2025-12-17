# Development Documentation - TIMS

This directory contains comprehensive development guidelines and resources for the Transport Information Management System (TIMS).

## 📚 Files in This Directory

- **[README.md](./README.md)** - This file: Comprehensive development guide
- **[notifications-reverb.md](./notifications-reverb.md)** - Real-time notifications setup with Laravel Reverb

## 📖 Overview

This document provides comprehensive development guidelines for the Transport Information Management System (TIMS).

## 📋 Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Project Structure](#2-project-structure)
3. [Coding Standards](#3-coding-standards)
4. [Adding New Modules](#4-adding-new-modules)
5. [Testing Guidelines](#5-testing-guidelines)
6. [Debugging](#6-debugging)
7. [Performance Optimization](#7-performance-optimization)
8. [Security Best Practices](#8-security-best-practices)
9. [Git Workflow](#9-git-workflow)
10. [Code Review Process](#10-code-review-process)

---

## 1. Development Environment Setup

### 1.1 Prerequisites

#### Required Software
- **PHP**: 8.2 or higher
- **Node.js**: 20.19+ or 22.12+
- **Composer**: Latest stable version
- **MySQL**: 8.0 or higher (or SQLite for development)
- **Git**: Latest stable version

#### Development Tools
- **VS Code**: Recommended IDE
- **Laravel Telescope**: Debug and monitoring
- **Laravel Debugbar**: Development debugging
- **PHPStorm**: Alternative IDE

### 1.2 Local Setup

#### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/tims.git
cd tims
```

#### Step 2: Install Dependencies
```bash
# Backend dependencies
composer install

# Frontend dependencies
npm install
```

#### Step 3: Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

#### Step 4: Database Setup
```bash
# Create database (MySQL)
mysql -u root -p
CREATE DATABASE tims_development;
EXIT;

# Or create SQLite database
touch database/database.sqlite
```

#### Step 5: Configure Environment
```env
# .env file
APP_NAME=TIMS
APP_ENV=local
APP_KEY=base64:your-generated-key
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tims_development
DB_USERNAME=root
DB_PASSWORD=your-password

# Or for SQLite
# DB_CONNECTION=sqlite
# DB_DATABASE=/full/path/to/tims/database/database.sqlite
```

#### Step 6: Run Migrations and Seeders
```bash
# Run migrations
php artisan migrate

# Seed database
php artisan db:seed
```

#### Step 7: Start Development Servers
```bash
# Terminal 1: Laravel backend
php artisan serve

# Terminal 2: Vite frontend
npm run dev
```

### 1.3 VS Code Configuration

#### Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "onecentlin.laravel-blade",
    "amirmarmul.laravel-vscode",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

#### Settings
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "php.suggest.basic": false,
  "php.validate.enable": true,
  "emmet.includeLanguages": {
    "blade": "html"
  },
  "tailwindCSS.includeLanguages": {
    "blade": "html"
  }
}
```

## 2. Project Structure

### 2.1 Backend Structure
```
app/
├── Actions/                  # Custom actions
├── Console/                  # Artisan commands
├── Exceptions/               # Custom exceptions
├── Http/
│   ├── Controllers/         # Request handlers
│   │   ├── TruckController.php
│   │   ├── DriverController.php
│   │   └── ...
│   ├── Middleware/          # HTTP middleware
│   │   ├── EnsureTruckPermission.php
│   │   └── ...
│   └── Requests/            # Form validation
│       ├── StoreTruckRequest.php
│       ├── UpdateTruckRequest.php
│       └── ...
├── Models/                  # Eloquent models
│   ├── Truck.php
│   ├── Driver.php
│   └── ...
├── Providers/               # Service providers
├── Services/                # Business logic
│   ├── TruckAssignmentService.php
│   └── MaintenanceService.php
└── ...
```

### 2.2 Frontend Structure
```
resources/js/
├── actions/                 # Custom actions
│   └── resolve-urls.ts
├── app.tsx                  # Main entry point
├── components/              # Reusable components
│   ├── ui/                  # Base UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── data-table.tsx       # Data table component
│   ├── delete-confirmation-dialog.tsx
│   └── activity-log-table.tsx
├── hooks/                   # Custom React hooks
│   ├── use-permissions.ts
│   └── use-toast.ts
├── layouts/                 # Layout components
│   ├── app-layout.tsx
│   └── app-sidebar-layout.tsx
├── lib/                     # Utility functions
│   ├── utils.ts
│   └── validation.ts
├── pages/                   # Inertia.js pages
│   ├── Auth/                # Authentication pages
│   ├── Dashboard.tsx        # Dashboard
│   ├── Trucks/              # Truck module pages
│   │   ├── Index.tsx
│   │   ├── Create.tsx
│   │   ├── Edit.tsx
│   │   └── Show.tsx
│   ├── Drivers/             # Driver module pages
│   └── ...
├── routes/                  # Frontend routes
├── types/                   # TypeScript types
│   ├── models.ts
│   └── index.ts
└── wayfinder/               # Wayfinder generated files
```

### 2.3 Database Structure
```
database/
├── factories/               # Model factories
│   ├── TruckFactory.php
│   ├── DriverFactory.php
│   └── ...
├── migrations/              # Database migrations
│   ├── 2024_01_01_000001_create_trucks_table.php
│   ├── 2024_01_01_000002_create_drivers_table.php
│   └── ...
└── seeders/                 # Database seeders
    ├── DatabaseSeeder.php
    ├── CheckPermissionSeeder.php
    └── TimsSeeder.php
```

## 3. Coding Standards

### 3.1 PHP Standards

#### PSR-12 Compliance
```php
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
        $search = $request->input('search');
        $sort = $request->input('sort', 'plate');
        $direction = $request->input('direction', 'asc');

        $query = Truck::with(['vehicletype']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('plate', 'like', "%{$search}%")
                  ->orWhere('chasisNumber', 'like', "%{$search}%")
                  ->orWhere('engineNumber', 'like', "%{$search}%");
            });
        }

        $trucks = $query->orderBy($sort, $direction)->paginate(15);

        return Inertia::render('Trucks/Index', [
            'trucks' => $trucks,
            'search' => $search,
            'sort' => $sort,
            'direction' => $direction,
            'success' => Session::get('success'),
            'error' => Session::get('error'),
        ]);
    }
}
```

#### Model Standards
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Truck extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'plate',
        'vehicletype_id',
        'chasisNumber',
        'engineNumber',
        'tyreSyze',
        'serviceIntervalKM',
        'purchasePrice',
        'productionDate',
        'serviceStartDate',
        'status',
    ];

    protected $casts = [
        'productionDate' => 'date',
        'serviceStartDate' => 'date',
    ];

    public function vehicletype()
    {
        return $this->belongsTo(VehicleType::class, 'vehicletype_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['plate', 'status', 'serviceIntervalKM'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
```

### 3.2 TypeScript Standards

#### Component Standards
```typescript
import React, { useState, useMemo } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { PageProps } from '@/types'
import { AppLayout } from '@/layouts/app-layout'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Truck } from '@/types/models'
import { Button } from '@/components/ui/button'
import { PlusCircledIcon } from '@radix-ui/react-icons'
import { Badge } from '@/components/ui/badge'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'

interface TruckIndexProps extends PageProps {
  trucks: PaginatedData<Truck>
  search?: string
  sort?: string
  direction?: 'asc' | 'desc'
  success?: string
  error?: string
}

export default function TruckIndex({
  auth,
  trucks,
  search,
  sort,
  direction,
  success,
  error
}: TruckIndexProps): JSX.Element {
  const { hasPermission } = usePermissions()
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null)

  const columns = useMemo<ColumnDef<Truck>[]>(
    () => [
      {
        accessorKey: 'plate',
        header: 'Plate',
        cell: ({ row }) => (
          <Link
            href={route('trucks.show', row.original.id)}
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            {row.getValue('plate')}
          </Link>
        ),
      },
      {
        accessorKey: 'vehicletype.name',
        header: 'Vehicle Type',
        cell: ({ row }) => row.original.vehicletype?.name || 'N/A',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          const variant = status === 'active' ? 'default' : 'secondary'
          return <Badge variant={variant}>{status}</Badge>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex space-x-2">
            {hasPermission('trucks.edit') && (
              <Link href={route('trucks.edit', row.original.id)}>
                <Button variant="outline" size="sm">Edit</Button>
              </Link>
            )}
            {hasPermission('trucks.destroy') && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteClick(row.original)}
              >
                Delete
              </Button>
            )}
          </div>
        ),
      },
    ],
    [hasPermission]
  )

  const handleDeleteClick = (truck: Truck) => {
    setSelectedTruck(truck)
    setShowDeleteDialog(true)
  }

  const handleDelete = () => {
    if (selectedTruck) {
      router.delete(route('trucks.destroy', selectedTruck.id), {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Truck deleted successfully.',
            variant: 'default',
          })
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to delete truck.',
            variant: 'destructive',
          })
        },
      })
    }
  }

  return (
    <AppLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Trucks</h2>}
    >
      <Head title="Trucks" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">
                  Trucks Manage your fleet of {trucks.total} trucks
                </h1>
                {hasPermission('trucks.create') && (
                  <Link href={route('trucks.create')}>
                    <Button>
                      <PlusCircledIcon className="mr-2 h-4 w-4" />
                      Add New Truck
                    </Button>
                  </Link>
                )}
              </div>

              {success && toast({ title: 'Success', description: success, variant: 'default' })}
              {error && toast({ title: 'Error', description: error, variant: 'destructive' })}

              <DataTable
                columns={columns}
                data={trucks}
                search={search}
                sort={sort}
                direction={direction}
                onSearch={(value) => router.get(route('trucks.index'), { search: value })}
                onSort={(field, direction) => router.get(route('trucks.index'), { sort: field, direction })}
              />

              <DeleteConfirmationDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Delete Truck"
                description={`Are you sure you want to delete the truck with plate ${selectedTruck?.plate}? This action cannot be undone.`}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
```

#### Type Definitions
```typescript
// types/models.ts
export interface Truck {
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
  vehicletype?: VehicleType
}

export interface Driver {
  id: number
  driverid: string
  name: string
  sex: 'male' | 'female'
  birthdate: string
  zone: string
  woreda: string
  kebele: string
  housenumber: string
  mobile: string
  hireddate: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface VehicleType {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface PaginatedData<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
  links: PaginationLink[]
}

export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}
```

## 4. Adding New Modules

### 4.1 Module Creation Process

#### Step 1: Create Model
```bash
php artisan make:model ModuleName -m
```

#### Step 2: Create Migration
```php
// database/migrations/xxxx_xx_xx_xxxxxx_create_module_names_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_names', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
            
            // Add indexes
            $table->index('name');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_names');
    }
};
```

#### Step 3: Update Model
```php
// app/Models/ModuleName.php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ModuleName extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'name',
        'description',
        'status',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
```

#### Step 4: Create Controller
```bash
php artisan make:controller ModuleNameController --resource
```

#### Step 5: Create Form Requests
```bash
php artisan make:request StoreModuleNameRequest
php artisan make:request UpdateModuleNameRequest
```

#### Step 6: Create Factory
```bash
php artisan make:factory ModuleNameFactory
```

#### Step 7: Create Seeder
```bash
php artisan make:seeder ModuleNameSeeder
```

#### Step 8: Add Routes
```php
// routes/web.php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('module-names', ModuleNameController::class);
    Route::get('module-names/export', [ModuleNameController::class, 'export'])->name('module-names.export');
});
```

#### Step 9: Create Frontend Pages
```typescript
// resources/js/pages/ModuleNames/Index.tsx
// resources/js/pages/ModuleNames/Create.tsx
// resources/js/pages/ModuleNames/Edit.tsx
// resources/js/pages/ModuleNames/Show.tsx
```

#### Step 10: Update Permissions
```php
// database/seeders/CheckPermissionSeeder.php
$permissions = [
    'module-names.view',
    'module-names.show',
    'module-names.create',
    'module-names.store',
    'module-names.edit',
    'module-names.update',
    'module-names.destroy',
    'module-names.export',
];
```

### 4.2 Module Template

#### Controller Template
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreModuleNameRequest;
use App\Http\Requests\UpdateModuleNameRequest;
use App\Models\ModuleName;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Facades\Activity;

class ModuleNameController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $query = ModuleName::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $moduleNames = $query->orderBy($sort, $direction)->paginate(15);

        return Inertia::render('ModuleNames/Index', [
            'moduleNames' => $moduleNames,
            'search' => $search,
            'sort' => $sort,
            'direction' => $direction,
            'success' => Session::get('success'),
            'error' => Session::get('error'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('ModuleNames/Create');
    }

    public function store(StoreModuleNameRequest $request): RedirectResponse
    {
        $moduleName = ModuleName::create($request->validated());
        
        Activity::performedOn($moduleName)
            ->causedBy(auth()->user())
            ->log('created');

        return Redirect::route('module-names.index')
            ->with('success', 'Module name created successfully.');
    }

    public function show(ModuleName $moduleName): Response
    {
        $activityLogs = Activity::forSubject($moduleName)
            ->with('causer')
            ->latest()
            ->get();

        return Inertia::render('ModuleNames/Show', [
            'moduleName' => $moduleName,
            'activityLogs' => $activityLogs,
        ]);
    }

    public function edit(ModuleName $moduleName): Response
    {
        return Inertia::render('ModuleNames/Edit', [
            'moduleName' => $moduleName,
        ]);
    }

    public function update(UpdateModuleNameRequest $request, ModuleName $moduleName): RedirectResponse
    {
        $oldAttributes = $moduleName->getAttributes();
        $moduleName->update($request->validated());
        $newAttributes = $moduleName->getAttributes();

        Activity::performedOn($moduleName)
            ->causedBy(auth()->user())
            ->withProperties(['old' => $oldAttributes, 'new' => $newAttributes])
            ->log('updated');

        return Redirect::route('module-names.index')
            ->with('success', 'Module name updated successfully.');
    }

    public function destroy(ModuleName $moduleName): RedirectResponse
    {
        Activity::performedOn($moduleName)
            ->causedBy(auth()->user())
            ->log('deleted');

        $moduleName->delete();

        return Redirect::route('module-names.index')
            ->with('success', 'Module name deleted successfully.');
    }

    public function export(Request $request)
    {
        try {
            $query = ModuleName::query();

            if ($request->search) {
                $query->where('name', 'like', "%{$request->search}%");
            }

            $moduleNames = $query->get();

            $filename = 'module_names_' . now()->format('Y-m-d_H-i-s') . '.csv';
            
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function () use ($moduleNames) {
                $file = fopen('php://output', 'w');
                
                // Add UTF-8 BOM for Excel compatibility
                fwrite($file, "\xEF\xBB\xBF");
                
                // Headers
                fputcsv($file, ['Name', 'Description', 'Status', 'Created At']);

                // Data
                foreach ($moduleNames as $moduleName) {
                    fputcsv($file, [
                        $moduleName->name,
                        $moduleName->description,
                        $moduleName->status,
                        $moduleName->created_at->format('Y-m-d H:i:s')
                    ]);
                }

                fclose($file);
            };

            Activity::log('Exported module names CSV with ' . $moduleNames->count() . ' records');

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Failed to export module names. Please try again.']);
        }
    }
}
```

## 5. Testing Guidelines

### 5.1 Unit Testing

#### Model Tests
```php
<?php

namespace Tests\Unit\Models;

use App\Models\Truck;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TruckTest extends TestCase
{
    use RefreshDatabase;

    public function test_truck_can_be_created()
    {
        $vehicleType = VehicleType::factory()->create();
        
        $truck = Truck::factory()->create([
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active'
        ]);

        $this->assertDatabaseHas('trucks', [
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id,
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

    public function test_truck_has_soft_deletes()
    {
        $truck = Truck::factory()->create();
        
        $truck->delete();
        
        $this->assertSoftDeleted('trucks', [
            'id' => $truck->id
        ]);
    }
}
```

### 5.2 Feature Testing

#### Controller Tests
```php
<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TruckControllerTest extends TestCase
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

    public function test_user_can_update_truck()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->put(route('trucks.update', $truck), [
                'plate' => $truck->plate,
                'vehicletype_id' => $truck->vehicletype_id,
                'chasisNumber' => $truck->chasisNumber,
                'engineNumber' => $truck->engineNumber,
                'tyreSyze' => $truck->tyreSyze,
                'serviceIntervalKM' => 15000,
                'purchasePrice' => $truck->purchasePrice,
                'productionDate' => $truck->productionDate,
                'serviceStartDate' => $truck->serviceStartDate,
                'status' => $truck->status
            ]);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', [
            'id' => $truck->id,
            'serviceIntervalKM' => 15000
        ]);
    }

    public function test_user_can_delete_truck()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->delete(route('trucks.destroy', $truck));

        $response->assertRedirect(route('trucks.index'));
        $this->assertSoftDeleted('trucks', [
            'id' => $truck->id
        ]);
    }
}
```

### 5.3 Running Tests

#### Run All Tests
```bash
php artisan test
```

#### Run Specific Test Suite
```bash
# Unit tests only
php artisan test --testsuite=Unit

# Feature tests only
php artisan test --testsuite=Feature
```

#### Run Tests with Coverage
```bash
php artisan test --coverage
```

## 6. Debugging

### 6.1 Laravel Debugging

#### Laravel Telescope
```bash
# Install Telescope
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate

# Access Telescope
http://localhost:8000/telescope
```

#### Laravel Debugbar
```bash
# Install Debugbar
composer require barryvdh/laravel-debugbar --dev

# Access Debugbar
# Automatically appears in development mode
```

#### Logging
```php
// Custom logging
Log::info('User created truck', ['truck_id' => $truck->id]);
Log::error('Failed to create truck', ['error' => $e->getMessage()]);
Log::debug('Debug information', ['data' => $data]);
```

### 6.2 Frontend Debugging

#### React Developer Tools
```bash
# Install React DevTools browser extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

#### Console Logging
```typescript
// Debug logging
console.log('Component rendered', { props, state });
console.error('Error occurred', error);
console.warn('Warning message', data);
```

#### Debug Mode
```typescript
// Development-only debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug information', data);
}
```

## 7. Performance Optimization

### 7.1 Database Optimization

#### Query Optimization
```php
// Eager loading to prevent N+1 queries
$trucks = Truck::with(['vehicletype', 'maintenanceRecords'])
    ->paginate(15);

// Select specific columns
$trucks = Truck::select(['id', 'plate', 'status'])
    ->where('status', 'active')
    ->get();

// Use database indexes
Schema::table('trucks', function (Blueprint $table) {
    $table->index('plate');
    $table->index('status');
    $table->index('created_at');
});
```

#### Caching
```php
// Model caching
$trucks = Cache::remember('trucks.active', 3600, function () {
    return Truck::where('status', 'active')->get();
});

// Query result caching
$trucks = Truck::where('status', 'active')
    ->remember(3600)
    ->get();
```

### 7.2 Frontend Optimization

#### Code Splitting
```typescript
// Lazy loading components
const TruckCreate = lazy(() => import('./TruckCreate'));
const TruckEdit = lazy(() => import('./TruckEdit'));

// Route-based code splitting
const routes = [
  {
    path: '/trucks/create',
    component: lazy(() => import('./TruckCreate'))
  }
];
```

#### Memoization
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoize components
const MemoizedComponent = memo(function Component({ data }) {
  return <div>{data}</div>;
});
```

## 8. Security Best Practices

### 8.1 Input Validation

#### Backend Validation
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

#### Frontend Validation
```typescript
// Client-side validation
function validateTruck(data: TruckFormData): ValidationErrors {
  const errors: ValidationErrors = {}
  
  if (!data.plate) {
    errors.plate = 'Plate number is required'
  } else if (!/^[A-Z]{2}[0-9]{4}[A-Z]{2}$/.test(data.plate)) {
    errors.plate = 'Invalid Ethiopian plate format'
  }
  
  return errors
}
```

### 8.2 Authorization

#### Permission Checks
```php
// Middleware protection
Route::middleware(['permission:trucks.create'])->group(function () {
    Route::get('/trucks/create', [TruckController::class, 'create']);
    Route::post('/trucks', [TruckController::class, 'store']);
});

// Controller authorization
public function store(StoreTruckRequest $request)
{
    if (!$request->user()->can('trucks.create')) {
        abort(403, 'Insufficient permissions');
    }
    
    // Create truck logic
}
```

#### Frontend Permission Checks
```typescript
// Permission-based rendering
function TruckIndex() {
  const { hasPermission } = usePermissions()
  
  return (
    <div>
      {hasPermission('trucks.create') && (
        <Button onClick={() => router.visit(route('trucks.create'))}>
          Add Truck
        </Button>
      )}
    </div>
  )
}
```

## 9. Git Workflow

### 9.1 Branch Strategy

#### Feature Branches
```bash
# Create feature branch
git checkout -b feature/truck-management

# Make changes and commit
git add .
git commit -m "feat: add truck management functionality"

# Push to remote
git push origin feature/truck-management

# Create pull request
# Merge after review
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

### 9.2 Code Review Process

#### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Feature tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design tested
```

## 10. Code Review Process

### 10.1 Review Checklist

#### Backend Review
- [ ] PSR-12 compliance
- [ ] Proper error handling
- [ ] Input validation
- [ ] Authorization checks
- [ ] Activity logging
- [ ] Database optimization
- [ ] Test coverage

#### Frontend Review
- [ ] TypeScript compliance
- [ ] Component structure
- [ ] State management
- [ ] Error handling
- [ ] Accessibility
- [ ] Performance
- [ ] Responsive design

### 10.2 Review Guidelines

#### What to Look For
- Code quality and standards
- Security vulnerabilities
- Performance issues
- Test coverage
- Documentation
- Accessibility
- User experience

#### Review Comments
- Be constructive and specific
- Provide suggestions for improvement
- Ask questions for clarification
- Acknowledge good practices
- Focus on the code, not the person

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Status**: Production Ready  
**Maintainer**: Development Team
