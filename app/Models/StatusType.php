<?php

namespace App\Models;

use App\Traits\ClearsCacheOnModelEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StatusType extends Model
{
    use HasFactory, SoftDeletes, ClearsCacheOnModelEvents;

    protected $table = 'statustypes';

    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Get the statuses for the status type.
     */
    public function statuses(): HasMany
    {
        return $this->hasMany(Status::class, 'statustype_id');
    }
}



