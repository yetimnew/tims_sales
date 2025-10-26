<?php

namespace App\Http\Controllers\Settings;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;
use Laravel\Fortify\Features;

class TwoFactorAuthenticationController extends Controller
{
    /**
     * Show the two factor authentication settings page.
     */
    public function show(Request $request): Response
    {
        if (! Features::canManageTwoFactorAuthentication()) {
            abort(403);
        }

        return Inertia::render('settings/two-factor', [
            'enabled' => ! is_null($request->user()->two_factor_secret),
            'recoveryCodes' => $request->user()->recoveryCodes(),
        ]);
    }

    /**
     * Enable two factor authentication for the user.
     */
    public function store(Request $request): Response
    {
        if (! Features::canManageTwoFactorAuthentication()) {
            abort(403);
        }

        $request->user()->forceFill([
            'two_factor_secret' => encrypt(app(GenerateNewRecoveryCodes::class)(
                $request->user()
            )->getRecoveryCodes()),
        ])->save();

        return back(303);
    }

    /**
     * Generate new recovery codes for the user.
     */
    public function update(Request $request): Response
    {
        if (! Features::canManageTwoFactorAuthentication()) {
            abort(403);
        }

        app(GenerateNewRecoveryCodes::class)($request->user());

        return back(303);
    }

    /**
     * Disable two factor authentication for the user.
     */
    public function destroy(Request $request): Response
    {
        if (! Features::canManageTwoFactorAuthentication()) {
            abort(403);
        }

        $request->user()->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
        ])->save();

        return back(303);
    }
}

