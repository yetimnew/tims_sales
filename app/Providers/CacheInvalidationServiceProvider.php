<?php

namespace App\Providers;

use App\Services\CacheInvalidationService;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CacheInvalidationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Register cache clearing for Spatie Permission models
        Role::created(function ($role) {
            CacheInvalidationService::clearModelCaches($role);
        });

        Role::updated(function ($role) {
            CacheInvalidationService::clearModelCaches($role);
        });

        Role::deleted(function ($role) {
            CacheInvalidationService::clearModelCaches($role);
        });

        Permission::created(function ($permission) {
            CacheInvalidationService::clearModelCaches($permission);
        });

        Permission::updated(function ($permission) {
            CacheInvalidationService::clearModelCaches($permission);
        });

        Permission::deleted(function ($permission) {
            CacheInvalidationService::clearModelCaches($permission);
        });

        // Also clear caches when permissions are synced to roles
        Role::saved(function ($role) {
            if ($role->wasChanged('permissions')) {
                CacheInvalidationService::clearCaches([
                    'roles.permission_group_options',
                    'roles.create_permissions',
                    'permissions.module_options',
                ]);
            }
        });
    }
}

