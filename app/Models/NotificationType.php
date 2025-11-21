<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotificationType extends Model
{
    use HasFactory;

    public const TRUCK_CREATED = 'truck.created';

    public const TRUCK_UPDATED = 'truck.updated';

    public const TRUCK_DELETED = 'truck.deleted';

    public const USER_CREATED = 'user.created';

    public const USER_UPDATED = 'user.updated';

    public const USER_DELETED = 'user.deleted';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'key',
        'name',
        'description',
        'default_in_app',
        'default_email',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'default_in_app' => 'boolean',
        'default_email' => 'boolean',
    ];

    public function userSettings(): HasMany
    {
        return $this->hasMany(UserNotificationSetting::class);
    }
}
