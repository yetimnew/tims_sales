<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class VehicleType extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'vehicletypes';

    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Get the trucks for the vehicle type.
     */
    public function trucks(): HasMany
    {
        return $this->hasMany(Truck::class);
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'description'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('vehicle_types');
    }
}
