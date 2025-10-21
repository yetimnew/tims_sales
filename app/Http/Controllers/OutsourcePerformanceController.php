<?php

namespace App\Http\Controllers;

use App\Models\OutsourcePerformance;
use App\Models\Outsource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class OutsourcePerformanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $outsourcePerformances = OutsourcePerformance::with(['outsource'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('OutsourcePerformances/Index', [
            'outsourcePerformances' => $outsourcePerformances,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $outsources = Outsource::orderBy('name')->get();

        return Inertia::render('OutsourcePerformances/Create', [
            'outsources' => $outsources,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'outsource_id' => 'required|exists:outsources,id',
                'trip' => 'required|string|max:255',
                'DateDispach' => 'required|date',
                'DistanceWCargo' => 'required|numeric|min:0',
                'DistanceWOCargo' => 'nullable|numeric|min:0',
                'CargoVolumMT' => 'nullable|numeric|min:0',
                'satus' => 'required|string|in:active,inactive',
                'is_returned' => 'boolean',
            ]);

            $outsourcePerformance = OutsourcePerformance::create($validated);

            Log::info('Outsource performance created', [
                'outsource_performance_id' => $outsourcePerformance->id,
                'outsource_id' => $outsourcePerformance->outsource_id,
                'trip' => $outsourcePerformance->trip,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('outsource-performances.index')
                ->with('success', 'Outsource performance created successfully.');

        } catch (Exception $e) {
            Log::error('Outsource performance creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create outsource performance. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(OutsourcePerformance $outsourcePerformance): Response
    {
        $outsourcePerformance->load(['outsource']);

        return Inertia::render('OutsourcePerformances/Show', [
            'outsourcePerformance' => $outsourcePerformance,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(OutsourcePerformance $outsourcePerformance): Response
    {
        $outsources = Outsource::orderBy('name')->get();

        return Inertia::render('OutsourcePerformances/Edit', [
            'outsourcePerformance' => $outsourcePerformance,
            'outsources' => $outsources,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, OutsourcePerformance $outsourcePerformance)
    {
        try {
            $validated = $request->validate([
                'outsource_id' => 'required|exists:outsources,id',
                'trip' => 'required|string|max:255',
                'DateDispach' => 'required|date',
                'DistanceWCargo' => 'required|numeric|min:0',
                'DistanceWOCargo' => 'nullable|numeric|min:0',
                'CargoVolumMT' => 'nullable|numeric|min:0',
                'satus' => 'required|string|in:active,inactive',
                'is_returned' => 'boolean',
            ]);

            $outsourcePerformance->update($validated);

            Log::info('Outsource performance updated', [
                'outsource_performance_id' => $outsourcePerformance->id,
                'outsource_id' => $outsourcePerformance->outsource_id,
                'trip' => $outsourcePerformance->trip,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('outsource-performances.index')
                ->with('success', 'Outsource performance updated successfully.');

        } catch (Exception $e) {
            Log::error('Outsource performance update failed', [
                'outsource_performance_id' => $outsourcePerformance->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update outsource performance. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OutsourcePerformance $outsourcePerformance)
    {
        try {
            $outsourcePerformanceData = $outsourcePerformance->toArray();
            $outsourcePerformance->delete();

            Log::info('Outsource performance deleted', [
                'outsource_performance_id' => $outsourcePerformance->id,
                'trip' => $outsourcePerformanceData['trip'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('outsource-performances.index')
                ->with('success', 'Outsource performance deleted successfully.');

        } catch (Exception $e) {
            Log::error('Outsource performance deletion failed', [
                'outsource_performance_id' => $outsourcePerformance->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete outsource performance. Please try again.']);
        }
    }
}

