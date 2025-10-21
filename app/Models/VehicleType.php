<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class VehicleType extends Model
{
    use HasFactory, SoftDeletes;

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
}
