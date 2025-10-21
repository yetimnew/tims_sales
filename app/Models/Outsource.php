<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Outsource extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'service_type',
        'status',
    ];

    /**
     * Get the outsource performances for the outsource.
     */
    public function outsourcePerformances(): HasMany
    {
        return $this->hasMany(OutsourcePerformance::class);
    }
}



