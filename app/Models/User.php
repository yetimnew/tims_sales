<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Profile;
use App\Traits\ClearsCacheOnModelEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use App\Models\Driver;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, HasApiTokens, LogsActivity, Notifiable, TwoFactorAuthenticatable, ClearsCacheOnModelEvents;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Configure the activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('users');
    }

    public function notificationSettings(): HasMany
    {
        return $this->hasMany(UserNotificationSetting::class);
    }

    /**
     * Get the user's profile.
     */
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    /**
     * Get the driver record associated with this user (if user is a driver).
     * A user can optionally be a driver (nullable relationship).
     * 
     * @return HasOne
     */
    public function driver(): HasOne
    {
        return $this->hasOne(Driver::class);
    }

    /**
     * Check if the user is a driver.
     * 
     * @return bool
     */
    public function isDriver(): bool
    {
        return $this->driver !== null;
    }

    /**
     * Get the user's avatar URL.
     * Returns a relative path starting with '/storage/' so the frontend can construct the full URL.
     */
    public function getAvatarAttribute(): ?string
    {
        $profile = $this->profile;
        
        if ($profile && $profile->image) {
            // If the image path is already a full URL, return it as-is
            if (filter_var($profile->image, FILTER_VALIDATE_URL)) {
                return $profile->image;
            }
            
            // Check if file exists before generating URL
            if (Storage::disk('public')->exists($profile->image)) {
                // Return API route path for serving images with CORS headers
                // This ensures CORS headers are properly applied for Flutter web
                return '/api/storage/' . $profile->image;
            }
        }
        
        return null;
    }
}
