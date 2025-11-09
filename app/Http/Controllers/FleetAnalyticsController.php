<?php

namespace App\Http\Controllers;

use App\Services\Analytics\FleetAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FleetAnalyticsController extends Controller
{
    public function index(Request $request, FleetAnalyticsService $analyticsService)
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $analytics = $analyticsService->getDashboardMetrics($validated);

        return Inertia::render('Analytics/Cockpit', $analytics);
    }
}
