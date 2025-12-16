<?php

namespace App\Traits;

use App\Services\CacheInvalidationService;
use Illuminate\Database\Eloquent\Model;

trait ClearsCacheOnModelEvents
{
    /**
     * Boot the trait and register model event listeners.
     */
    public static function bootClearsCacheOnModelEvents(): void
    {
        // Clear cache when model is created
        static::created(function (Model $model) {
            CacheInvalidationService::clearModelCaches($model);
        });

        // Clear cache when model is updated
        static::updated(function (Model $model) {
            CacheInvalidationService::clearModelCaches($model);
        });

        // Clear cache when model is deleted
        static::deleted(function (Model $model) {
            CacheInvalidationService::clearModelCaches($model);
        });

        // Clear cache when model is restored (for soft deletes)
        if (method_exists(static::class, 'restored')) {
            static::restored(function (Model $model) {
                CacheInvalidationService::clearModelCaches($model);
            });
        }
    }
}

