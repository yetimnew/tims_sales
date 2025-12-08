<?php

namespace App\Policies;

use App\Models\OutsourcePerformance;
use App\Models\User;

class OutsourcePerformancePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('outsource-performances.view-any')
            || $user->can('outsource-performances.view-own');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, OutsourcePerformance $outsourcePerformance): bool
    {
        if ($user->can('outsource-performances.view-any')) {
            return true;
        }

        if ($user->can('outsource-performances.view-own')) {
            return $this->ownsOutsourcePerformance($user, $outsourcePerformance);
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('outsource-performances.create')
            || $user->can('outsource-performances.store');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, OutsourcePerformance $outsourcePerformance): bool
    {
        if (! $user->can('outsource-performances.update')) {
            return false;
        }

        if ($user->can('outsource-performances.view-any')) {
            return true;
        }

        if ($user->can('outsource-performances.view-own')) {
            return $this->ownsOutsourcePerformance($user, $outsourcePerformance);
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, OutsourcePerformance $outsourcePerformance): bool
    {
        if (! $user->can('outsource-performances.destroy')) {
            return false;
        }

        if ($user->can('outsource-performances.view-any')) {
            return true;
        }

        if ($user->can('outsource-performances.view-own')) {
            return $this->ownsOutsourcePerformance($user, $outsourcePerformance);
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, OutsourcePerformance $outsourcePerformance): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, OutsourcePerformance $outsourcePerformance): bool
    {
        return false;
    }

    private function ownsOutsourcePerformance(User $user, OutsourcePerformance $outsourcePerformance): bool
    {
        return (int) $outsourcePerformance->user_id === (int) $user->id;
    }
}
