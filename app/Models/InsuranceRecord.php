<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InsuranceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'truck_id',
        'policy_number',
        'insurance_company',
        'start_date',
        'end_date',
        'premium_amount',
        'coverage_type',
        'coverage_details',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'premium_amount' => 'decimal:2',
    ];

    /**
     * Get the truck that owns the insurance record.
     */
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    /**
     * Scope a query to only include active insurance records.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include expired insurance records.
     */
    public function scopeExpired($query)
    {
        return $query->where('end_date', '<', now());
    }

    /**
     * Scope a query to only include expiring soon insurance records.
     */
    public function scopeExpiringSoon($query, $days = 30)
    {
        return $query->where('end_date', '<=', now()->addDays($days))
                    ->where('end_date', '>=', now());
    }

    /**
     * Scope a query to filter by coverage type.
     */
    public function scopeCoverageType($query, $type)
    {
        return $query->where('coverage_type', $type);
    }

    /**
     * Scope a query to filter by insurance company.
     */
    public function scopeInsuranceCompany($query, $company)
    {
        return $query->where('insurance_company', $company);
    }

    /**
     * Check if insurance is expired.
     */
    public function getIsExpiredAttribute()
    {
        return $this->end_date < now();
    }

    /**
     * Check if insurance is expiring soon.
     */
    public function getIsExpiringSoonAttribute()
    {
        return $this->end_date <= now()->addDays(30) && $this->end_date >= now();
    }

    /**
     * Get the days until expiration.
     */
    public function getDaysUntilExpirationAttribute()
    {
        return now()->diffInDays($this->end_date, false);
    }

    /**
     * Get the monthly premium amount.
     */
    public function getMonthlyPremiumAttribute()
    {
        $months = $this->start_date->diffInMonths($this->end_date);
        if ($months > 0) {
            return $this->premium_amount / $months;
        }
        return $this->premium_amount;
    }

    /**
     * Get the coverage details as an array.
     */
    public function getCoverageDetailsArrayAttribute()
    {
        if ($this->coverage_details) {
            return json_decode($this->coverage_details, true);
        }
        return [];
    }
}



