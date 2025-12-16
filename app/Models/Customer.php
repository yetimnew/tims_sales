<?php

namespace App\Models;

use App\Traits\ClearsCacheOnModelEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Customer extends Model
{
    use HasFactory, SoftDeletes, LogsActivity, ClearsCacheOnModelEvents;

    protected $fillable = [
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'status',
    ];

    /**
     * Get the operations for the customer.
     */
    public function operations(): HasMany
    {
        return $this->hasMany(Operation::class);
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'contact_person', 'phone', 'email', 'address', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('customers');
    }
}



