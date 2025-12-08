<?php

namespace App\Policies;

use App\Models\Performance;
use App\Models\User;

class PerformancePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('performances.view-any')
            || $user->can('performances.view-own');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Performance $performance): bool
    {
        if ($user->can('performances.view-any')) {
            return true;
        }

        if ($user->can('performances.view-own')) {
            return $this->ownsPerformance($user, $performance);
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('performances.create')
            || $user->can('performances.store');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Performance $performance): bool
    {
        if (! $user->can('performances.update')) {
            return false;
        }

        if ($user->can('performances.view-any')) {
            return true;
        }

        if ($user->can('performances.view-own')) {
            return $this->ownsPerformance($user, $performance);
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Performance $performance): bool
    {
        if (! $user->can('performances.destroy')) {
            return false;
        }

        if ($user->can('performances.view-any')) {
            return true;
        }

        if ($user->can('performances.view-own')) {
            return $this->ownsPerformance($user, $performance);
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Performance $performance): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Performance $performance): bool
    {
        return false;
    }

    private function ownsPerformance(User $user, Performance $performance): bool
    {
        return (int) $performance->user_id === (int) $user->id;
    }
}
